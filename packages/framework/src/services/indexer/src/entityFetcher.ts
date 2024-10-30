import { EventEmitter } from 'node:events'
import {
  PendingWork,
  PendingWorkPool,
  StorageValueStream,
  Utils,
} from '@aleph-indexer/core'
import { FetcherMsClient } from '../../fetcher/client.js'
import { NonceTimestamp } from './nonce.js'
import {
  EntityRequest,
  EntityRequestParams,
  EntityRequestStorage,
  EntityRequestType,
} from './dal/entityRequest.js'
import {
  EntityRequestPendingEntity,
  EntityRequestPendingEntityStorage,
  EntityRequestPendingEntityDALIndex,
} from './dal/entityRequestPendingEntity.js'
import {
  EntityRequestResponse,
  EntityRequestResponseStorage,
  EntityRequestResponseDALIndex,
  EntityParsedResponse,
} from './dal/entityRequestResponse.js'
import { EntityRequestIncomingEntityStorage } from './dal/entityRequestIncomingEntity.js'
import {
  AccountDateRange,
  GetEntityPendingRequestsRequestArgs,
  IdRange,
} from './types.js'
import {
  BlockchainId,
  IndexableEntityType,
  ParsedEntity,
} from '../../../types.js'

const {
  Future,
  BufferExec,
  JobRunner,
  DebouncedJob,
  Mutex,
  arrayFromAsyncIterator,
} = Utils

export interface TransactionResponse<T> {
  request: EntityRequest
  response: StorageValueStream<T>
  remove: () => Promise<void>
}

export abstract class BaseIndexerEntityFetcher<
  T extends ParsedEntity<unknown>,
> {
  protected checkPendingRetriesJob!: Utils.JobRunner
  protected checkCompletionJob!: Utils.DebouncedJob<void>
  protected requestFutures: Record<number, Utils.Future<EntityRequest>> = {}
  protected requestMutex = new Mutex()
  protected events: EventEmitter = new EventEmitter()
  protected incomingEntities: PendingWorkPool<T>
  protected toRetryBuffer: Utils.BufferExec<EntityRequestPendingEntity>
  protected toRemoveBuffer: Utils.BufferExec<EntityRequestPendingEntity>

  constructor(
    protected blockchainId: BlockchainId,
    protected type: IndexableEntityType,
    protected fetcherMsClient: FetcherMsClient,
    protected entityRequestDAL: EntityRequestStorage,
    protected entityRequestIncomingEntityDAL: EntityRequestIncomingEntityStorage<T>,
    protected entityRequestPendingEntityDAL: EntityRequestPendingEntityStorage,
    protected entityRequestResponseDAL: EntityRequestResponseStorage<T>,
    protected nonce: NonceTimestamp,
  ) {
    this.incomingEntities = new PendingWorkPool({
      id: `${type}-indexer-incoming-entities`,
      interval: 0,
      chunkSize: 1000,
      concurrency: 1,
      dal: this.entityRequestIncomingEntityDAL,
      handleWork: this.handleIncomingEntities.bind(this),
      checkComplete: async (): Promise<boolean> => true,
    })

    this.checkPendingRetriesJob = new JobRunner({
      name: `${type}-indexer-pending-retries`,
      interval: 1000 * 60 * 10,
      intervalFn: this.handlePendingRetries.bind(this),
    })

    this.checkCompletionJob = new DebouncedJob<void>(
      this.checkAllRequestCompletion.bind(this),
    )

    this.toRetryBuffer = new BufferExec<EntityRequestPendingEntity>(
      this.handleRetryPendingEntities.bind(this),
      1000,
    )

    this.toRemoveBuffer = new BufferExec<EntityRequestPendingEntity>(
      this.handleRemovePendingTransactions.bind(this),
      1000,
    )
  }

  async start(): Promise<void> {
    await this.incomingEntities.start()
    this.checkPendingRetriesJob.start().catch(() => 'ignore')
  }

  async stop(): Promise<void> {
    await this.incomingEntities.stop()
    this.checkPendingRetriesJob.stop().catch(() => 'ignore')
  }

  async fetchEntitiesById(params: IdRange): Promise<number> {
    return this.handleEntityRequest({
      type: EntityRequestType.ById,
      params,
    })
  }

  async fetchAccountEntitiesByDate(params: AccountDateRange): Promise<number> {
    return this.handleEntityRequest({
      type: EntityRequestType.ByDateRange,
      params,
    })
  }

  onResponse(handler: (request: EntityRequest) => void): void {
    this.events.on('response', handler)
  }

  offResponse(handler: (request: EntityRequest) => void): void {
    this.events.off('response', handler)
  }

  async getRequests(
    filters?: GetEntityPendingRequestsRequestArgs,
  ): Promise<EntityRequest[]> {
    let requests: EntityRequest[] = []

    if (filters?.nonce !== undefined) {
      const req = await this.entityRequestDAL.get(filters.nonce.toString())
      requests = req ? [req] : requests
    } else {
      const requestsIt = await this.entityRequestDAL.getAllValues()
      requests = await arrayFromAsyncIterator(requestsIt)
    }

    if (filters?.requestType !== undefined) {
      requests = requests.filter((item) => item.type === filters.requestType)
    }

    if (filters?.complete !== undefined) {
      requests = requests.filter((item) => {
        return (
          (filters.complete && item.complete) ||
          (!filters.complete && !item.complete)
        )
      })
    }

    const filterAcc = filters?.account
    if (filterAcc !== undefined) {
      requests = requests.filter(
        (item) =>
          item.type !== EntityRequestType.ById &&
          item.params?.account === filterAcc,
      )
    }

    const filterSig = filters?.id
    if (filterSig !== undefined) {
      requests = requests.filter(
        (item) =>
          item.type === EntityRequestType.ById &&
          item.params.ids.includes(filterSig),
      )
    }

    return requests
  }

  async onEntities(chunk: T[]): Promise<void> {
    return this.storeIncomingEntities(chunk)
  }

  async isRequestComplete(nonce: number): Promise<boolean> {
    const request = await this.entityRequestDAL.get(nonce.toString())
    if (!request) throw new Error(`Request with nonce ${nonce} does not exist`)

    return !!request.complete
  }

  async awaitRequestComplete(nonce: number): Promise<void> {
    if (!(await this.isRequestComplete(nonce))) {
      await this.getFuture(nonce).promise
    }
  }

  async getResponse(nonce: number): Promise<TransactionResponse<T>> {
    const request = await this.entityRequestDAL.get(nonce.toString())
    if (!request) throw new Error(`Request with nonce ${nonce} does not exist`)

    if (!request.complete) {
      await this.getFuture(nonce).promise
    }

    const response = (await this.entityRequestResponseDAL
      .useIndex(EntityRequestResponseDALIndex.NonceIndex)
      .getAllValuesFromTo([nonce], [nonce], {
        reverse: false,
      })) as StorageValueStream<EntityParsedResponse<T>>

    return {
      request,
      response,
      remove: async () => {
        this.log('----> REMOVE REQ 🎈', request.nonce)
        await this.entityRequestDAL.remove(request)
        // remove nonce from nonceIndex and update response
        const items = []
        for await (const item of response) {
          delete item.nonceIndexes[request.nonce]
          items.push(item)
        }
        await this.entityRequestResponseDAL.save(items)
      },
    }
  }

  protected async storeIncomingEntities(chunk: T[]): Promise<void> {
    const works = chunk.map((entity) => ({
      id: entity.id,
      time: Date.now(),
      payload: entity,
    }))

    return this.incomingEntities.addWork(works)
  }

  protected async handleIncomingEntities(
    works: PendingWork<T>[],
  ): Promise<number | void> {
    const chunk = works.map((work) => work.payload)

    const now1 = Date.now()
    const release = await this.requestMutex.acquire()
    const now2 = Date.now()

    try {
      const requests = await this.entityRequestDAL.getAllValues()

      const requestsNonces = []
      let lastFilteredTxs = 0

      let filteredTxs: EntityRequestResponse<T>[] = []
      let remainingTxs: T[] = chunk
      let requestCount = 0

      for await (const request of requests) {
        const { nonce, complete } = request
        if (complete) continue

        const result = this.filterIncomingEntitiesByRequest(
          remainingTxs,
          request,
        )

        const requestResponses =
          result.filteredEntities as EntityRequestResponse<T>[]
        for (const responses of requestResponses) {
          ;(responses as EntityRequestResponse<T>).nonceIndexes = { [nonce]: 0 }
        }
        filteredTxs = filteredTxs.concat(requestResponses)
        remainingTxs = result.remainingEntities
        requestCount++

        lastFilteredTxs = filteredTxs.length - lastFilteredTxs
        requestsNonces.push([nonce, lastFilteredTxs])
      }

      this.log(
        `Filtering txs ${filteredTxs.length} of ${chunk.length} by ${requestCount} pending requests`,
      )

      if (filteredTxs.length === 0) return

      const pendingIds = filteredTxs as unknown as EntityRequestPendingEntity[]

      //this.log(`Removing pendingIds`, pendingIds.map((p) => p.id).join('\n'))

      await this.entityRequestResponseDAL.save(filteredTxs)
      await this.entityRequestPendingEntityDAL.remove(pendingIds)

      this.checkCompletionJob.run().catch(() => 'ignore')
    } finally {
      release()
    }

    const elapsed1 = Date.now() - now1
    const elapsed2 = Date.now() - now2

    this.log(`onEntities time => ${elapsed1 / 1000} | ${elapsed2 / 1000}`)
  }

  protected filterIncomingEntitiesByRequest(
    entities: T[],
    request: EntityRequest,
  ): {
    filteredEntities: T[]
    remainingEntities: T[]
  } {
    const filteredEntities: T[] = []
    const remainingEntities: T[] = []

    switch (request.type) {
      case EntityRequestType.ById: {
        const { ids } = request.params
        const idSet = new Set(ids)

        for (const entity of entities) {
          const valid = idSet.has(entity.id)

          valid ? filteredEntities.push(entity) : remainingEntities.push(entity)
        }

        break
      }
      default: {
        throw new Error(
          `"filterIncomingEntitiesByRequest" is NOT implemented on ${this.blockchainId} ${this.type} entity fetcher for ${request.type} request type`,
        )
      }
    }

    return {
      filteredEntities,
      remainingEntities,
    }
  }

  protected async handleEntityRequest(
    requestParams: EntityRequestParams,
    waitForResponse = false,
  ): Promise<number> {
    const { blockchainId } = this
    const nonce = this.nonce.get()
    const future = this.getFuture(nonce)
    let count = 0
    let request = {
      blockchainId,
      nonce,
      complete: !count,
      count,
      ...requestParams,
    }

    // @note: Sometimes we receive the responses before inserting the pending signatures on
    // the db, the purpose of this mutex is to avoid this
    const now1 = Date.now()
    const release = await this.requestMutex.acquire()
    const now2 = Date.now()

    try {
      const idsStream = await this.fetchEntityIds(requestParams)

      if (!idsStream)
        throw new Error(
          `Error fetching transactions by ${
            EntityRequestType[requestParams.type]
          }`,
        )

      for await (const ids of idsStream) {
        const pendingIds = ids.map((id) => {
          return { blockchainId, id, nonces: [nonce] }
        })

        const requestResponse = ids.map((id, index) => {
          return { id, nonceIndexes: { [nonce]: index } }
        })

        await this.entityRequestResponseDAL.save(requestResponse)
        await this.entityRequestPendingEntityDAL.save(pendingIds)

        count += ids.length
      }

      request = {
        ...request,
        complete: !count,
        count,
      }

      await this.entityRequestDAL.save(request)
    } finally {
      release()
    }

    const elapsed1 = Date.now() - now1
    const elapsed2 = Date.now() - now2
    this.log(`onRequest time => ${elapsed1 / 1000} | ${elapsed2 / 1000}`)

    this.log(`🟡 Request ${nonce} initialized with ${count} entities`)

    if (!count) {
      this.log(`🟢 Request ${nonce} complete`)
      this.resolveFuture(request)
    }

    // @note: Will be resolved when the requested txs come asynchronously
    if (waitForResponse) {
      await future.promise
    }

    return nonce
  }

  protected async fetchEntityIds(
    requestParams: EntityRequestParams,
  ): Promise<void | string[][] | AsyncIterable<string[]>> {
    const { type, params } = requestParams

    switch (type) {
      case EntityRequestType.ById: {
        await this.fetcherMsClient
          .useBlockchain(this.blockchainId)
          .fetchEntitiesById({ type: this.type, ...params })
        return [params.ids]
      }
      case EntityRequestType.ByDateRange: {
        return this.fetcherMsClient
          .useBlockchain(this.blockchainId)
          .fetchAccountEntitiesByDate({ type: this.type, ...params })
      }
      default: {
        return []
      }
    }
  }

  protected async checkAllRequestCompletion(): Promise<void> {
    const requests = await this.entityRequestDAL.getAllValues()

    for await (const request of requests) {
      await this.checkRequestCompletion(request)
    }
  }

  protected async checkRequestCompletion(
    request: EntityRequest,
  ): Promise<void> {
    const { nonce, complete } = request
    if (complete) return

    let pending = !!(await this.entityRequestPendingEntityDAL
      .useIndex(EntityRequestPendingEntityDALIndex.Nonce)
      .getFirstKeyFromTo([nonce], [nonce]))

    // @note: Debug false positives completing request when there are pending txs
    if (!pending) {
      this.log('pending enter =>', pending)

      const pendings = await this.entityRequestPendingEntityDAL
        .useIndex(EntityRequestPendingEntityDALIndex.Nonce)
        .getAllFromTo([nonce], [nonce])

      let pending2 = false
      for await (const item of pendings) {
        pending2 = true
        break
      }

      if (pending !== pending2) {
        pending = pending2
        this.log('👺👺👺 ERROR checkRequestCompletion => ', nonce)
      }
    }

    if (pending) {
      this.log(`🔴 Request ${nonce} pending`)
      return
    }

    await this.entityRequestDAL.save({ ...request, complete: true })
    this.log(`🟢 Request ${nonce} complete`)

    this.resolveFuture(request)
  }

  protected async checkAllPendingSignatures(): Promise<void> {
    const requests = await this.entityRequestDAL.getAllValues()

    for await (const request of requests) {
      await this.checkPendingSignatures(request, false)
    }

    await this.drainPendingSignaturesBuffer()
  }

  protected async checkPendingSignatures(
    request: EntityRequest,
    drain = true,
  ): Promise<void> {
    const { nonce } = request

    const pendings = await this.entityRequestPendingEntityDAL
      .useIndex(EntityRequestPendingEntityDALIndex.Nonce)
      .getAllValuesFromTo([nonce], [nonce])

    for await (const pending of pendings) {
      const { id: signature } = pending

      const tx = await this.entityRequestResponseDAL.get(signature)

      this.log(
        `[Retry] Check ${tx?.id}`,
        !!tx,
        tx && 'parsed' in (tx || {}),
        tx?.nonceIndexes[nonce],
        request.nonce,
      )

      const hasResponse = !!tx && 'parsed' in tx && tx.nonceIndexes[nonce] >= 0

      hasResponse
        ? await this.toRemoveBuffer.add(pending)
        : await this.toRetryBuffer.add(pending)
    }

    if (drain) {
      await this.drainPendingSignaturesBuffer()
    }
  }

  protected async drainPendingSignaturesBuffer(): Promise<void> {
    await this.toRemoveBuffer.drain()
    await this.toRetryBuffer.drain()
  }

  protected async handlePendingRetries(): Promise<void> {
    await this.checkAllPendingSignatures()
    await this.checkCompletionJob.run()
  }

  protected getFuture(nonce: number): Utils.Future<EntityRequest> {
    let future = this.requestFutures[nonce]

    if (!future) {
      future = new Future<EntityRequest>()
      this.requestFutures[nonce] = future
    }

    return future
  }

  protected resolveFuture(request: EntityRequest): void {
    const { nonce } = request
    this.requestFutures[nonce]?.resolve(request)
    console.log('🍭 emit complete request with nonce', nonce)

    setImmediate(() => {
      this.events.emit('response', request)
      delete this.requestFutures[nonce]
    })
  }

  protected async handleRetryPendingEntities(
    pendings: EntityRequestPendingEntity[],
  ): Promise<void> {
    const ids = pendings.map(({ id }) => id)

    this.log(`Retrying ${ids.length} ${this.blockchainId} ids`)

    return this.fetcherMsClient
      .useBlockchain(this.blockchainId as BlockchainId)
      .fetchEntitiesById({ type: this.type, ids })
  }

  protected async handleRemovePendingTransactions(
    pendings: EntityRequestPendingEntity[],
  ): Promise<void> {
    this.log(`Removing ${pendings.length} pending signatures`)
    return this.entityRequestPendingEntityDAL.remove(pendings)
  }

  protected log(...msgs: any[]): void {
    console.log(`${this.blockchainId} ${this.type} | ${msgs.join(' ')}`)
  }
}
