import { StorageValueStream, Utils } from '@aleph-indexer/core'
import { TransactionFetcher } from './transactionFetcher.js'
import { FetcherMsClient } from '../../../fetcher/client.js'
import {
  TransactionIndexerState,
  TransactionIndexerStateDALIndex,
  TransactionIndexerStateCode,
  TransactionIndexerStateStorage,
} from './dal/transactionIndexerState.js'
import {
  AccountIndexerState,
  AccountIndexerTransactionRequestArgs,
  AccountDateRange,
  TransactionIndexerHandler,
} from './types.js'
import {
  clipDateRangesFromIterable,
  DateRange,
  getIntervalFromDateRange,
  mergeDateRangesFromIterable,
} from '../../../../utils/time.js'
import { AccountTransactionHistoryState } from '../../../fetcher/src/base/types.js'

const { JobRunner, JobRunnerReturnCode } = Utils

export class AccountTransactionIndexer {
  protected fetchAllJob!: Utils.JobRunner
  protected compactionJob!: Utils.JobRunner
  protected processorJob!: Utils.JobRunner
  protected txResponseHandler: (requestNonce: number) => Promise<void>

  constructor(
    protected config: AccountIndexerTransactionRequestArgs,
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
    const { blockchainId, account } = this.config

    await this.initPendingRanges()

    // @note: Subscribe to range request responses
    this.transactionFetcher.onResponse(this.txResponseHandler)

    await this.fetcherMsClient
      .useBlockchain(blockchainId)
      .addAccountTransactionFetcher({ account })

    this.fetchAllJob.start().catch(() => 'ignore')
    this.compactionJob.start().catch(() => 'ignore')
    this.processorJob.start().catch(() => 'ignore')
  }

  async stop(): Promise<void> {
    const { blockchainId, account } = this.config

    // @note: Unsubscribe from range request responses
    this.transactionFetcher.offResponse(this.txResponseHandler)

    await this.fetcherMsClient
      .useBlockchain(blockchainId)
      .delAccountTransactionFetcher({ account })

    this.fetchAllJob.stop().catch(() => 'ignore')
    this.compactionJob.stop().catch(() => 'ignore')
    this.processorJob.stop().catch(() => 'ignore')
  }

  async getIndexingState(): Promise<AccountIndexerState | undefined> {
    const { blockchainId, account } = this.config

    const state = await this.fetcherMsClient
      .useBlockchain(blockchainId)
      .getAccountTransactionFetcherState({ account })

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
      account,
      accurate,
      progress,
      pending,
      processed,
    }
  }

  protected async getPendingRanges(): Promise<DateRange[]> {
    const { blockchainId, account } = this.config

    const state = await this.fetcherMsClient
      .useBlockchain(blockchainId)
      .getAccountTransactionFetcherState({ account })

    const availableToFetch = this.getAvailableRangesToFetch(state)
    if (!availableToFetch) return []

    const ranges = await this.calculateRangesToFetch(account, availableToFetch)

    console.log(state, ranges)

    return ranges
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
    const { Processed } = TransactionIndexerStateCode

    const fetchedRanges = await this.transactionIndexerStateDAL
      .useIndex(TransactionIndexerStateDALIndex.AccountState)
      .getAllValuesFromTo([account, Processed], [account, Processed], {
        reverse: false,
        atomic: true,
      })

    const { newRanges, oldRanges, mergedRanges } =
      await mergeDateRangesFromIterable(fetchedRanges)

    if (!newRanges.length) return mergedRanges

    const newStates = newRanges.map((range) => {
      const newState = range as TransactionIndexerState
      newState.account = account
      newState.state = Processed
      newState.requestNonce = undefined
      return newState
    })

    const oldStates = oldRanges.map((range) => {
      const oldState = range as TransactionIndexerState
      oldState.account = account
      oldState.state = Processed
      oldState.requestNonce = undefined
      return oldState
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
    await this.transactionIndexerStateDAL.save(newStates)
    await this.transactionIndexerStateDAL.remove(oldStates)

    return mergedRanges
  }

  protected async processRanges({
    interval,
  }: {
    interval: number
  }): Promise<number | void> {
    const { blockchainId, account } = this.config
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
        blockchainId,
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

  protected async calculateRangesToFetch(
    account: string,
    totalDateRange: DateRange,
    clipRanges?: StorageValueStream<TransactionIndexerState>,
  ): Promise<DateRange[]> {
    const { endDate } = totalDateRange

    clipRanges =
      clipRanges ||
      (await this.transactionIndexerStateDAL.getAllValuesFromTo(
        [account, undefined],
        [account, endDate],
        { reverse: false, atomic: true },
      ))

    return clipDateRangesFromIterable([totalDateRange], clipRanges)
  }

  protected getAvailableRangesToFetch(
    state: AccountTransactionHistoryState<unknown> | undefined,
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
}
