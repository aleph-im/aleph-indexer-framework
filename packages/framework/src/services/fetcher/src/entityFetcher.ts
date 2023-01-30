import { DateTime } from 'luxon'
import { ServiceBroker } from 'moleculer'
import {
  EntityStorage,
  PendingWork,
  PendingWorkPool,
  Utils,
} from '@aleph-indexer/core'
import {
  FetchEntitiesByIdRequestArgs,
  EntityFetcherState,
  CheckEntityRequestArgs,
  EntityState,
  DelEntityRequestArgs,
} from './types.js'
import { MsIds } from '../../common.js'
import { PendingEntityStorage } from './dal/pendingEntity.js'
import { RawEntityMsg } from '../../parser/src/types.js'
import { Blockchain, IndexableEntityType, RawEntity } from '../../../types.js'

const { sleep } = Utils

/**
 * The main class of the fetcher service.
 */
export abstract class BaseEntityFetcher<RE extends RawEntity> {
  protected pendingEntities: PendingWorkPool<string[]>
  protected pendingEntitiesCache: PendingWorkPool<string[]>
  protected pendingEntitiesFetch: PendingWorkPool<string[]>

  protected throughput = 0
  protected throughputInit = Date.now()

  /**
   * Initialize the fetcher service.
   * @param broker The moleculer broker to assign to the service.
   * @param pendingEntityDAL The pending entities' storage.
   * @param pendingEntityCacheDAL
   * @param pendingEntityFetchDAL
   * @param entityCacheDAL The raw entities' storage.
   */
  constructor(
    protected type: IndexableEntityType,
    protected blockchainId: Blockchain,
    protected broker: ServiceBroker,
    protected pendingEntityDAL: PendingEntityStorage,
    protected pendingEntityCacheDAL: PendingEntityStorage,
    protected pendingEntityFetchDAL: PendingEntityStorage,
    protected entityCacheDAL: EntityStorage<RE>,
  ) {
    this.pendingEntitiesCache = new PendingWorkPool({
      id: `${blockchainId}:pending-${type}-cache`,
      interval: 0,
      chunkSize: 10,
      concurrency: 1,
      dal: this.pendingEntityCacheDAL,
      handleWork: this.handlePendingEntitiesCache.bind(this),
      checkComplete: () => true,
    })

    this.pendingEntitiesFetch = new PendingWorkPool({
      id: `${blockchainId}:pending-${type}-fetch`,
      interval: 0,
      chunkSize: 200,
      concurrency: 5,
      dal: this.pendingEntityFetchDAL,
      handleWork: this.handlePendingEntitiesFetch.bind(this),
      checkComplete: (work): Promise<boolean> =>
        this.entityCacheDAL.exists(work.id),
    })

    this.pendingEntities = new PendingWorkPool({
      id: `${blockchainId}:pending-${type}`,
      interval: 0,
      chunkSize: 1000,
      concurrency: 1,
      dal: this.pendingEntityDAL,
      handleWork: this.handlePendingEntities.bind(this),
      checkComplete: () => true,
    })
  }

  async start(): Promise<void> {
    await this.pendingEntitiesCache.start()
    await this.pendingEntitiesFetch.start()
    await this.pendingEntities.start()
  }

  async stop(): Promise<void> {
    await this.pendingEntitiesCache.stop()
    await this.pendingEntitiesFetch.stop()
    await this.pendingEntities.stop()
  }

  async getState(): Promise<EntityFetcherState> {
    const pendingEntities = await this.pendingEntities.getCount()

    return {
      pendingEntities,
      entitiesThroughput: Math.round(
        this.throughput / ((Date.now() - this.throughputInit) / 1000),
      ),
    }
  }

  /**
   * Fetch entities from an account by ids.
   * @param args Entity ids.
   */
  async fetchEntitiesById(args: FetchEntitiesByIdRequestArgs): Promise<void> {
    const { ids, indexerId } = args

    console.log(
      `🔗 ${ids.length} new ids added to the ${this.type} fetcher queue... [${indexerId}]`,
    )

    const entities = ids.filter(this.filterEntityId.bind(this)).map((id) => ({
      id,
      time: Date.now(),
      payload: indexerId ? [indexerId] : [],
    }))

    await this.pendingEntities.addWork(entities)
  }

  /**
   * Fetch entities from ids.
   * @param works Entity ids with extra properties as time and payload.
   */
  protected async handlePendingEntities(
    works: PendingWork<string[]>[],
  ): Promise<void> {
    console.log(
      `${this.type} pending | Start handling entities ${works.length}`,
    )

    const toFetchWorks: PendingWork<string[]>[] = []
    const inCacheWorks: PendingWork<string[]>[] = []

    const ids = works.map((work) => work.id)
    const txs = await this.entityCacheDAL.getMany(ids)

    for (const [i, tx] of txs.entries()) {
      if (!tx) {
        toFetchWorks.push(works[i])
      } else {
        inCacheWorks.push(works[i])
      }
    }

    console.log(
      `${this.type} pending | Response ${toFetchWorks.length}/${inCacheWorks.length} toFetch/inCache`,
    )

    if (toFetchWorks.length > 0) {
      await this.pendingEntitiesFetch.addWork(toFetchWorks)
    }

    if (inCacheWorks.length > 0) {
      await this.pendingEntitiesCache.addWork(inCacheWorks)
    }
  }

  protected async handlePendingEntitiesCache(
    works: PendingWork<string[]>[],
  ): Promise<void> {
    console.log(`${this.type} cache | Start getting entities ${works.length}`)

    const entities = await this.entityCacheDAL.getMany(
      works.map((work) => work.id),
    )

    const msgs = works.map((work, i) => ({
      type: this.type,
      entity: entities[i] as RE,
      peers: work.payload,
    }))

    await this.emitEntities(msgs)

    console.log(`${this.type} cache | Response ${msgs.length} found in cache`)
  }

  protected async handlePendingEntitiesFetch(
    works: PendingWork<string[]>[],
  ): Promise<number | void> {
    console.log(
      `${this.type} fetching | Start fetching entities ${works.length}`,
    )

    let totalPendings = 0

    let [entities, pending] = await this.fetchIds(works, false)
    let retries = 3

    while (pending.length > 0 && retries-- > 0) {
      await sleep(1000)

      console.log(
        `⚠️ retrying ${pending.length} ${this.type}  entities [${retries}]`,
      )

      const [entities2, pending2] = await this.fetchIds(pending, true)

      pending = pending2
      entities = entities.concat(entities2)

      retries++
    }

    if (pending.length) {
      console.log(
        `‼️ ${pending.length} ${this.type} entities not found after 3 retries`,
      )
      totalPendings += pending.length
    }

    await this.entityCacheDAL.save(entities.map(({ entity }) => entity))

    const cacheWorks = entities.map(({ entity, peers }) => ({
      id: entity.id,
      time: Date.now(),
      payload: peers || [],
    }))

    await this.pendingEntitiesCache.addWork(cacheWorks)

    console.log(
      `${this.type} fetching | Response ${entities.length} requests${
        totalPendings > 0 ? `, ${totalPendings} errors` : ''
      }`,
    )

    if (totalPendings > 0) return 1000 * 5
  }

  protected async fetchIds(
    works: PendingWork<string[]>[],
    isRetry = false,
  ): Promise<[RawEntityMsg<RE>[], PendingWork<string[]>[]]> {
    const ids = works.map(({ id }) => id)

    const response = await this.remoteFetchIds(ids, isRetry)

    if (response.length !== ids.length)
      throw new Error(`Invalid ${this.type} entities response length`)

    const pendingWork: PendingWork<string[]>[] = []
    const entities: RawEntityMsg<RE>[] = []

    for (const [i, entity] of response.entries()) {
      const work = works[i]

      if (entity === null || entity === undefined) {
        pendingWork.push(work)
      } else {
        // @todo: Remove this, it shouldn't be necessary anymore
        // and need to be handled on the "remoteFetchIds" method
        // entity.signature = entity.signature || work.id
        const entityWithPeers = { type: this.type, entity, peers: work.payload }
        entities.push(entityWithPeers)
      }
    }

    return [entities, pendingWork]
  }

  /**
   * Used to improve performance.
   * @param count Entitys counter.
   */
  protected addThroughput(count: number): void {
    // @note: Reset if there is an overflow
    const now = Date.now()

    if (
      this.throughput >= Number.MAX_SAFE_INTEGER - count || // overflow
      now - this.throughputInit >= 1000 * 60 * 60 // >= 1 hour
    ) {
      this.throughput = 0
      this.throughputInit = now
    }

    this.throughput += count
  }

  /**
   * Emit entities to the parser.
   * @param entities Raw entities.
   */
  protected async emitEntities(entities: RawEntityMsg<RE>[]): Promise<void> {
    if (!entities.length) return

    console.log(
      `✉️  ${entities.length} ${this.type} entities sent by the fetcher...`,
    )

    this.addThroughput(entities.length)

    return this.broker.emit(
      `fetcher.${this.blockchainId}.${this.type}`,
      entities,
      [MsIds.Parser],
    )
  }

  /**
   * Returns the fetch status of certain txn signatures.
   * @param signatures The txn signatures to get its state.
   */
  async getEntityState(args: CheckEntityRequestArgs): Promise<EntityState[]> {
    const { ids } = args
    const firstPending = await this.pendingEntities.getFirstValue()

    return Promise.all(
      ids.map(async (id: string) => {
        const data: RE | undefined = await this.entityCacheDAL.get(id)
        const pending = await this.pendingEntities.get(id)

        let pendingAddTime, pendingExecTime

        if (pending) {
          pendingAddTime = DateTime.fromMillis(pending.time).toUTC().toISO()
          pendingExecTime = DateTime.fromMillis(
            Date.now() + (pending.time - (firstPending?.time || pending.time)),
          )
            .toUTC()
            .toISO()
        }

        const state: EntityState = {
          id,
          isCached: !!data,
          isPending: !!pending,
          pendingAddTime,
          pendingExecTime,
          data,
        }

        return state
      }),
    )
  }

  /**
   * Delete the cached entity.
   * @param args The txn ids to delete the cache for.
   */
  async delEntityCache(args: DelEntityRequestArgs): Promise<void> {
    const { ids } = args
    const entities = ids.map((id) => {
      return { id }
    }) as RE[]

    await this.entityCacheDAL.remove(entities)
  }

  /**
   * Fetch entities from a RPC Node.
   * @param works Entity ids with extra properties as time and payload.
   */
  protected abstract remoteFetchIds(
    ids: string[],
    isRetry: boolean,
  ): Promise<(RE | null | undefined)[]>

  /**
   * Guard to validate an id.
   * @param id Id to validate.
   */
  protected abstract filterEntityId(id: string): boolean
}
