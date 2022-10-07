import {StorageValueStream, Utils} from '@aleph-indexer/core'
import {TransactionFetcher} from './transactionFetcher.js'
import {FetcherMsClient} from '../../../fetcher/client.js'
import {
  TransactionIndexerState,
  TransactionIndexerStateCode,
  TransactionIndexerStateDALIndex,
  TransactionIndexerStateStorage,
} from '../dal/transactionIndexerState.js'
import {
  AccountDateRange,
  AccountIndexerState,
  AccountTransactionsIndexerArgs,
  TransactionIndexerHandler,
} from '../types.js'
import {
  clipIntervals, generatorToArray,
  getIntervalFromDateRange,
  getIntervalsFromStorageStream,
  mergeIntervals,
} from '../../../../utils/time.js'
import {DateTime, Interval} from "luxon";

const { JobRunner, JobRunnerReturnCode } = Utils

export class AccountTransactionIndexer {
  protected fetchAllJob!: Utils.JobRunner
  protected compactionJob!: Utils.JobRunner
  protected processorJob!: Utils.JobRunner
  protected txResponseHandler: (requestNonce: number) => Promise<void>

  constructor(
    protected config: AccountTransactionsIndexerArgs,
    protected handler: TransactionIndexerHandler,
    protected fetcherMsClient: FetcherMsClient,
    protected transactionFetcher: TransactionFetcher,
    protected transactionIndexerStateDAL: TransactionIndexerStateStorage,
  ) {
    const { account } = config

    this.fetchAllJob = new JobRunner({
      name: `transaction-indexer-fetcher ${account}`,
      interval: this.config.chunkDelay,
      intervalMax: 1000 * 60 * 5, // 5min
      intervalFn: this.fetchAllRanges.bind(this),
    })

    this.compactionJob = new JobRunner({
      name: `transaction-indexer-compactor ${account}`,
      interval: 1000 * 60 * 5, // 5min
      intervalFn: this.compactStates.bind(this),
    })

    this.processorJob = new JobRunner({
      name: `transaction-indexer-processor ${account}`,
      interval: Math.max(this.config.chunkDelay, 1000 * 5),
      intervalMax: 1000 * 60 * 5, // 5min
      intervalFn: this.processRanges.bind(this),
    })

    this.txResponseHandler = this.onTransactionResponse.bind(this)
  }

  async start(): Promise<void> {
    const { account } = this.config

    await this.initPendingRanges()

    // @note: Subscribe to range request responses
    this.transactionFetcher.onResponse(this.txResponseHandler)

    await this.fetcherMsClient.addAccountFetcher({ account })

    this.fetchAllJob.start().catch(() => 'ignore')
    this.compactionJob.start().catch(() => 'ignore')
    this.processorJob.start().catch(() => 'ignore')
  }

  async stop(): Promise<void> {
    const { account } = this.config

    // @note: Unsubscribe from range request responses
    this.transactionFetcher.offResponse(this.txResponseHandler)

    await this.fetcherMsClient.delAccountFetcher({ account })

    this.fetchAllJob.stop().catch(() => 'ignore')
    this.compactionJob.stop().catch(() => 'ignore')
    this.processorJob.stop().catch(() => 'ignore')
  }

  async getIndexingState(
    account: string,
  ): Promise<AccountIndexerState | undefined> {
    const state = await this.fetcherMsClient.getAccountFetcherState({ account })

    if (
      !state ||
      state.firstTimestamp === undefined ||
      state.lastTimestamp === undefined
    )
      return

    const toFetchRange = Interval.fromDateTimes(
      DateTime.fromMillis(state.firstTimestamp + (state.completeHistory ? 0 : 1)),
      DateTime.fromMillis(state.lastTimestamp),
    )

    const processedRanges = await this.mergeStates()

    const pendingRanges = await generatorToArray(clipIntervals([toFetchRange], processedRanges))

    const pendingMilis = pendingRanges.reduce(
      (acc, curr) => acc + curr.toDuration().as('milliseconds'),
      0,
    )

    const processedMillis = processedRanges.reduce(
      (acc, curr) => acc + curr.toDuration().as('milliseconds'),
      0,
    )

    const pending = pendingRanges.map((interval) => interval.toISO())

    const processed = processedRanges.map((interval) => interval.toISO())

    const accurate = state?.completeHistory || false

    const progress = Number(
      ((processedMillis / (processedMillis + pendingMilis)) * 100).toFixed(2),
    )

    return {
      account,
      accurate,
      progress,
      pending,
      processed,
    }
  }

  protected async* getPendingRanges(account: string): AsyncGenerator<Interval> {
    const state = await this.fetcherMsClient.getAccountFetcherState({ account })

    if (!state || state.firstTimestamp === undefined || state.lastTimestamp === undefined)
      return []

    yield* this.calculateRangesToFetch(account, Interval.fromDateTimes(
      DateTime.fromMillis(state.firstTimestamp + (state.completeHistory ? 0 : 1)),
      DateTime.fromMillis(state.lastTimestamp),
    ))
  }

  // async fetchRange(dateRange: DateRange): Promise<void> {
  //   const ranges = await this.calculateRangesToFetch(dateRange)
  //   console.log('get events ranges', ranges)

  //   // @note: Do not return anything, and fetch missed ranges
  //   if (ranges.length) return

  //   await this.fetchRangeByDate(dateRange)
  // }

  protected async initPendingRanges(): Promise<void> {
    const { account } = this.config
    const { Ready, Pending } = TransactionIndexerStateCode

    // @note: Check the current pending ranges
    const pendingRanges = await this.transactionIndexerStateDAL
      .useIndex(TransactionIndexerStateDALIndex.AccountState)
      .getAllValuesFromTo([account, Pending], [account, Pending], {
        reverse: false,
        atomic: true,
      })

    for await (const range of pendingRanges) {
      const requestNonce = range.requestNonce as number

      const isComplete = await this.transactionFetcher.isRequestComplete(
        requestNonce,
      )

      if (!isComplete) continue

      // @note: Update the state of the request to ready (mark for processing)
      await this.transactionIndexerStateDAL.save({
        ...range,
        requestNonce,
        state: Ready,
      })
    }
  }

  protected async onTransactionResponse(requestNonce: number): Promise<void> {
    const { Ready, Pending } = TransactionIndexerStateCode

    const range = await this.transactionIndexerStateDAL
      .useIndex(TransactionIndexerStateDALIndex.RequestState)
      .getFirstValueFromTo([requestNonce, Pending], [requestNonce, Pending], {
        atomic: true,
      })

    if (!range) return

    // @note: Update the state of the request to ready (mark for processing)
    await this.transactionIndexerStateDAL.save({
      ...range,
      requestNonce,
      state: Ready,
    })
  }

  protected async fetchAllRanges({interval}: { interval: number }): Promise<number | void> {
    const { account } = this.config

    let ranges = await generatorToArray(this.getPendingRanges(account))
    if (ranges.length === 0) return interval + 1000 // @note: delay 1sec

    const targetRange = ranges[ranges.length - 1]

    const endDate = targetRange.end.toMillis()
    const startDate = Math.max(
      targetRange.start.toMillis(),
      endDate - this.config.chunkTimeframe,
    )

    const requests = [{ account, startDate, endDate }]

    // @note: if we finished with the latest range, take also the next one and do a request
    // This prevents from getting stuck on new ranges coming in real time
    if (endDate - startDate < this.config.chunkTimeframe && ranges.length > 1) {
      const targetRange = ranges[ranges.length - 2]

      const endDate = targetRange.end.toMillis()
      const startDate = Math.max(
        targetRange.start.toMillis(),
        endDate - this.config.chunkTimeframe,
      )

      requests.push({ account, startDate, endDate })
    }

    await Promise.all(requests.map(this.fetchRangeByDate.bind(this)))

    return JobRunnerReturnCode.Reset
  }

  protected async compactStates(): Promise<void> {
    await this.mergeStates()
  }

  protected async mergeStates(): Promise<Interval[]> {
    const { account } = this.config
    const { Processed } = TransactionIndexerStateCode

    const fetchedRanges = await this.transactionIndexerStateDAL
      .useIndex(TransactionIndexerStateDALIndex.AccountState)
      .getAllValuesFromTo([account, Processed], [account, Processed], {
        reverse: false,
        atomic: true,
      })

    const { newRanges, oldRanges, mergedRanges } =
      await mergeIntervals(getIntervalsFromStorageStream(fetchedRanges))

    if (!newRanges.length) return mergedRanges

    const newStates = newRanges.map((range) => {
      return {
        startDate: range.start.toMillis(),
        endDate: range.end.toMillis(),
        timeFrame: range.toDuration().toMillis(),
        account,
        state: Processed,
        requestNonce: undefined
      } as TransactionIndexerState
    })

    const oldStates = oldRanges.map((range) => {
      return {
        startDate: range.start.toMillis(),
        endDate: range.end.toMillis(),
        timeFrame: range.toDuration().toMillis(),
        state: Processed,
        account,
        requestNonce: undefined
      } as TransactionIndexerState
    })

    // console.log(
    //   `💿 compact fetching states
    //     newStates: ${newStates.length},
    //     oldStates: ${oldStates.length}
    //   `,
    // )

    console.log(
      `💿 compact fetching states *
        newStates: [
          ${newStates
            .map((s) => `[${s.state}]${getIntervalFromDateRange(s.startDate, s.endDate).toISO()}`)
            .join('\n')}
        ],
        oldStates: [
          ${oldStates
            .map((s) => `[${s.state}]${getIntervalFromDateRange(s.startDate, s.endDate).toISO()}`)
            .join('\n')}
        ]
      `,
    )

    // @note: Ordering is important for not causing
    // race conditions issues on pending ranges calculation due
    // to empty processed entries in db
    await this.transactionIndexerStateDAL.save(newStates)
    await this.transactionIndexerStateDAL.remove(oldStates)

    return mergedRanges
  }

  protected async processRanges({
    interval,
  }: {
    interval: number
  }): Promise<number | void> {
    const { account } = this.config
    const { Ready, Processed } = TransactionIndexerStateCode

    const completeRanges = await this.transactionIndexerStateDAL
      .useIndex(TransactionIndexerStateDALIndex.AccountState)
      .getAllValuesFromTo([account, Ready], [account, Ready], {
        reverse: false,
        atomic: true,
      })

    let count = 0

    for await (const range of completeRanges) {
      const nonce = range.requestNonce as number

      // @note: Obtain the response of the ready ranges
      const reqResponse = await this.transactionFetcher.getResponse(nonce)
      const { response, remove } = reqResponse

      // @note: Process the response (delegated to the domain layer)
      await this.handler.onTxDateRange({
        account,
        startDate: range.startDate,
        endDate: range.endDate,
        txs: response,
      })

      // @note: Update the state of the request to processed (mark for compaction)
      await this.transactionIndexerStateDAL.save({
        ...range,
        requestNonce: undefined,
        state: Processed,
      })

      // @note: Remove the request state on the transaction fetcher
      await remove()

      count++
    }

    console.log(`📦 ${count} ranges processed`)

    return count > 0 ? JobRunnerReturnCode.Reset : interval + 1000 // @note: Delay 1 sec
  }

  protected async fetchRangeByDate(dateRange: AccountDateRange): Promise<void> {
    const { Pending, Ready } = TransactionIndexerStateCode

    // @note: Do the request and get the nonce
    const nonce = await this.transactionFetcher.fetchAccountTransactionsByDate(
      dateRange,
    )

    // @note: Save the pending state of the request
    await this.transactionIndexerStateDAL.save({
      ...dateRange,
      requestNonce: nonce,
      state: Pending,
    })

    // @note: Wait till the request is complete
    await this.transactionFetcher.awaitRequestComplete(nonce)

    // @note: Update the state to ready
    // (in some cases, the response comes before saving the pending state, so we must always check it here too)
    await this.transactionIndexerStateDAL.save({
      ...dateRange,
      requestNonce: nonce,
      state: Ready,
    })
  }

  protected async* calculateRangesToFetch(
    account: string,
    totalDateRange: Interval,
    clipRanges?: StorageValueStream<TransactionIndexerState>,
  ): AsyncGenerator<Interval> {
    clipRanges =
      clipRanges ||
      await this.transactionIndexerStateDAL.getAllValuesFromTo(
        [account, undefined],
        [account, totalDateRange.end.toMillis()],
        { reverse: false, atomic: true },
      )

    yield* clipIntervals([totalDateRange], getIntervalsFromStorageStream(clipRanges))
  }
}
