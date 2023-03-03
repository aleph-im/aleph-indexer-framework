import { StorageValueStream, Utils } from '@aleph-indexer/core'
import { BaseIndexerEntityFetcher } from './entityFetcher.js'
import { FetcherMsClient } from '../../fetcher/client.js'
import {
  EntityIndexerState,
  EntityIndexerStateDALIndex,
  EntityIndexerStateCode,
  EntityIndexerStateStorage,
} from './dal/entityIndexerState.js'
import {
  AccountIndexerEntityRequestArgs,
  AccountDateRange,
  EntityIndexerHandler,
  AccountEntityIndexerState,
} from './types.js'
import {
  clipDateRangesFromIterable,
  DateRange,
  getIntervalFromDateRange,
  mergeDateRangesFromIterable,
} from '../../../utils/time.js'
import { AccountEntityHistoryState } from '../../fetcher/src/types.js'
import { ParsedEntity } from '../../../types.js'

const { JobRunner, JobRunnerReturnCode } = Utils

export class BaseAccountEntityIndexer<T extends ParsedEntity<unknown>> {
  protected fetchAllJob!: Utils.JobRunner
  protected compactionJob!: Utils.JobRunner
  protected processorJob!: Utils.JobRunner
  protected entityResponseHandler: (requestNonce: number) => Promise<void>

  constructor(
    protected config: AccountIndexerEntityRequestArgs,
    protected handler: EntityIndexerHandler<T>,
    protected fetcherMsClient: FetcherMsClient,
    protected entityFetcher: BaseIndexerEntityFetcher<T>,
    protected entityIndexerStateDAL: EntityIndexerStateStorage,
  ) {
    const { type, account } = config

    this.fetchAllJob = new JobRunner({
      name: `${type}-indexer-fetcher ${account}`,
      interval: this.config.chunkDelay,
      intervalMax: 1000 * 60 * 5, // 5min
      intervalFn: this.fetchAllRanges.bind(this),
    })

    this.compactionJob = new JobRunner({
      name: `${type}-indexer-compactor ${account}`,
      interval: 1000 * 60 * 5, // 5min
      intervalFn: this.compactStates.bind(this),
    })

    this.processorJob = new JobRunner({
      name: `${type}-indexer-processor ${account}`,
      interval: Math.max(this.config.chunkDelay, 1000 * 5),
      intervalMax: 1000 * 60 * 5, // 5min
      intervalFn: this.processRanges.bind(this),
    })

    this.entityResponseHandler = this.onEntityResponse.bind(this)
  }

  async start(): Promise<void> {
    await this.initPendingRanges()

    // @note: Subscribe to range request responses
    this.entityFetcher.onResponse(this.entityResponseHandler)

    await this.addAccountEntityFetcher()

    this.fetchAllJob.start().catch(() => 'ignore')
    this.compactionJob.start().catch(() => 'ignore')
    this.processorJob.start().catch(() => 'ignore')
  }

  async stop(): Promise<void> {
    // @note: Unsubscribe from range request responses
    this.entityFetcher.offResponse(this.entityResponseHandler)

    await this.delAccountEntityFetcher()

    this.fetchAllJob.stop().catch(() => 'ignore')
    this.compactionJob.stop().catch(() => 'ignore')
    this.processorJob.stop().catch(() => 'ignore')
  }

  async getIndexingState(): Promise<AccountEntityIndexerState | undefined> {
    const { account } = this.config

    const state = await this.getAccountEntityFetcherState()

    const availableToFetch = this.getAvailableRangesToFetch(state)
    if (!availableToFetch) return

    const processedRanges = await this.mergeStates()

    const pendingRanges = await clipDateRangesFromIterable(
      [availableToFetch],
      processedRanges,
    )

    const pendingMilis = pendingRanges.reduce(
      (acc, curr) => acc + Math.abs(curr.endDate - curr.startDate),
      0,
    )

    const processedMilis = processedRanges.reduce(
      (acc, curr) => acc + Math.abs(curr.endDate - curr.startDate),
      0,
    )

    const pending = pendingRanges.map((range) =>
      getIntervalFromDateRange(range).toISO(),
    )

    const processed = processedRanges.map((range) =>
      getIntervalFromDateRange(range).toISO(),
    )

    const accurate = state?.completeHistory || false

    const progress = Number(
      ((processedMilis / (processedMilis + pendingMilis)) * 100).toFixed(2),
    )

    return {
      blockchain: this.config.blockchainId,
      type: this.config.type,
      indexer: 'unknown',
      account,
      accurate,
      progress,
      pending,
      processed,
    }
  }

  protected async getPendingRanges(): Promise<DateRange[]> {
    const { account } = this.config

    const state = await this.getAccountEntityFetcherState()

    const availableToFetch = this.getAvailableRangesToFetch(state)
    if (!availableToFetch) return []

    const ranges = await this.calculateRangesToFetch(account, availableToFetch)
    return ranges
  }

  protected async initPendingRanges(): Promise<void> {
    const { account } = this.config
    const { Ready, Pending } = EntityIndexerStateCode

    // @note: Check the current pending ranges
    const pendingRanges = await this.entityIndexerStateDAL
      .useIndex(EntityIndexerStateDALIndex.AccountState)
      .getAllValuesFromTo([account, Pending], [account, Pending], {
        reverse: false,
        atomic: true,
      })

    for await (const range of pendingRanges) {
      const requestNonce = range.requestNonce as number

      const isComplete = await this.entityFetcher.isRequestComplete(
        requestNonce,
      )

      if (!isComplete) continue

      // @note: Update the state of the request to ready (mark for processing)
      await this.entityIndexerStateDAL.save({
        ...range,
        requestNonce,
        state: Ready,
      })
    }
  }

  /**
   * Callback for when the entity fetcher signals that a request has been (partially) completed and is ready for processing.
   * @param requestNonce The nonce of the request that is ready for processing
   * @param page The page of the request that is ready for processing
   * @protected
   */
  protected async onEntityResponse(requestNonce: number, page: number): Promise<void> {
    const { Ready, Pending } = EntityIndexerStateCode

    const range = await this.entityIndexerStateDAL
      .useIndex(EntityIndexerStateDALIndex.RequestState)
      .getFirstValueFromTo([requestNonce, Pending], [requestNonce, Pending], {
        atomic: true,
      })

    if (!range) return

    // @note: Update the state of the request to ready (mark for processing)
    await this.entityIndexerStateDAL.save({
      ...range,
      requestNonce,
      state: Ready,
      page,
    })
  }

  protected async fetchAllRanges({
    interval,
  }: {
    interval: number
  }): Promise<number | void> {
    const { blockchainId, account } = this.config

    const ranges = await this.getPendingRanges()
    if (!ranges.length) return interval + 1000 // @note: delay 1sec

    const targetRange = ranges[ranges.length - 1]

    const endDate = targetRange.endDate
    const startDate = Math.max(
      targetRange.startDate,
      endDate - this.config.chunkTimeframe,
    )

    const requests = [{ blockchainId, account, startDate, endDate }]

    // @note: if we finished with the latest range, take also the next one and do a request
    // This prevents from getting stuck on new ranges comming on real time
    if (endDate - startDate < this.config.chunkTimeframe && ranges.length > 1) {
      const targetRange = ranges[ranges.length - 2]

      const endDate = targetRange.endDate
      const startDate = Math.max(
        targetRange.startDate,
        endDate - this.config.chunkTimeframe,
      )

      requests.push({ blockchainId, account, startDate, endDate })
    }

    await Promise.all(requests.map(this.fetchRangeByDate.bind(this)))

    return JobRunnerReturnCode.Reset
  }

  protected async compactStates(): Promise<void> {
    await this.mergeStates()
  }

  protected async mergeStates(): Promise<DateRange[]> {
    const { account } = this.config
    const { Processed } = EntityIndexerStateCode

    const fetchedRanges = await this.entityIndexerStateDAL
      .useIndex(EntityIndexerStateDALIndex.AccountState)
      .getAllValuesFromTo([account, Processed], [account, Processed], {
        reverse: false,
        atomic: true,
      })

    const { newRanges, oldRanges, mergedRanges } =
      await mergeDateRangesFromIterable(fetchedRanges)

    if (!newRanges.length) return mergedRanges

    const newStates = newRanges.map((range) => {
      const newState = range as EntityIndexerState
      newState.account = account
      newState.state = Processed
      newState.requestNonce = undefined
      return newState
    })

    const oldStates = oldRanges.map((range) => {
      const oldState = range as EntityIndexerState
      oldState.account = account
      oldState.state = Processed
      oldState.requestNonce = undefined
      return oldState
    })

    // this.log(
    //   `💿 compact fetching states
    //     newStates: ${newStates.length},
    //     oldStates: ${oldStates.length}
    //   `,
    // )

    this.log(
      `💿 compact fetching states *
        newStates: [
          ${newStates
            .map((s) => `[${s.state}]${getIntervalFromDateRange(s).toISO()}`)
            .join('\n')}
        ],
        oldStates: [
          ${oldStates
            .map((s) => `[${s.state}]${getIntervalFromDateRange(s).toISO()}`)
            .join('\n')}
        ]
      `,
    )

    // @note: Ordering is important for not causing
    // race conditions issues on pending ranges calculation due
    // to empty processed entries in db
    await this.entityIndexerStateDAL.save(newStates)
    await this.entityIndexerStateDAL.remove(oldStates)

    return mergedRanges
  }

  protected async processRanges({
    interval,
  }: {
    interval: number
  }): Promise<number | void> {
    const { blockchainId, account } = this.config
    const { Ready, Processed } = EntityIndexerStateCode

    const completeRanges = await this.entityIndexerStateDAL
      .useIndex(EntityIndexerStateDALIndex.AccountState)
      .getAllValuesFromTo([account, Ready], [account, Ready], {
        reverse: false,
        atomic: true,
      })

    let count = 0

    for await (const range of completeRanges) {
      const nonce = range.requestNonce as number

      // @note: Obtain the response of the ready ranges
      const reqResponse = await this.entityFetcher.getResponse(nonce)
      const { response, remove } = reqResponse

      // @note: Process the response (delegated to the domain layer)
      await this.handler.onEntityDateRange({
        blockchainId,
        account,
        startDate: range.startDate,
        endDate: range.endDate,
        type: this.config.type,
        entities: response,
      })

      // @note: Update the state of the request to processed (mark for compaction)
      await this.entityIndexerStateDAL.save({
        ...range,
        requestNonce: undefined,
        state: Processed,
      })

      // @note: Remove the request state on the entity fetcher
      await remove()

      count++
    }

    this.log(`📦 ${count} ranges processed`)

    return count > 0 ? JobRunnerReturnCode.Reset : interval + 1000 // @note: Delay 1 sec
  }

  protected async fetchRangeByDate(dateRange: AccountDateRange): Promise<void> {
    const { Pending, Ready } = EntityIndexerStateCode

    // @note: Do the request and get the nonce
    const nonce = await this.entityFetcher.fetchAccountEntitiesByDate(dateRange)

    // @note: Save the pending state of the request
    await this.entityIndexerStateDAL.save({
      ...dateRange,
      requestNonce: nonce,
      state: Pending,
    })

    // @note: Wait till the request is complete
    await this.entityFetcher.awaitRequestComplete(nonce)

    // @note: Update the state to ready
    // (in some cases, the response comes before saving the pending state, so we must always check it here too)
    await this.entityIndexerStateDAL.save({
      ...dateRange,
      requestNonce: nonce,
      state: Ready,
    })
  }

  protected async calculateRangesToFetch(
    account: string,
    totalDateRange: DateRange,
    clipRanges?: StorageValueStream<EntityIndexerState>,
  ): Promise<DateRange[]> {
    const { endDate } = totalDateRange

    clipRanges =
      clipRanges ||
      (await this.entityIndexerStateDAL.getAllValuesFromTo(
        [account, undefined],
        [account, endDate],
        { reverse: false, atomic: true },
      ))

    return clipDateRangesFromIterable([totalDateRange], clipRanges)
  }

  protected getAvailableRangesToFetch(
    state: AccountEntityHistoryState<unknown> | undefined,
  ): AccountDateRange | undefined {
    if (
      !state ||
      state.firstTimestamp === undefined ||
      state.lastTimestamp === undefined
    )
      return

    return {
      blockchainId: state.blockchain,
      account: state.account,
      startDate: state.firstTimestamp,
      endDate: state.lastTimestamp,
    }
  }

  protected async addAccountEntityFetcher(): Promise<void> {
    const { type, blockchainId, account } = this.config

    await this.fetcherMsClient
      .useBlockchain(blockchainId)
      .addAccountEntityFetcher({ type, account })
  }

  protected async delAccountEntityFetcher(): Promise<void> {
    const { type, blockchainId, account } = this.config

    await this.fetcherMsClient
      .useBlockchain(blockchainId)
      .delAccountEntityFetcher({ type, account })
  }

  protected async getAccountEntityFetcherState(): Promise<
    AccountEntityHistoryState<unknown> | undefined
  > {
    const { type, blockchainId, account } = this.config

    return this.fetcherMsClient
      .useBlockchain(blockchainId)
      .getAccountEntityFetcherState({ type, account })
  }

  protected log(...msgs: any[]): void {
    const { blockchainId, type } = this.config
    console.log(`${blockchainId} ${type} | ${msgs.join(' ')}`)
  }
}
