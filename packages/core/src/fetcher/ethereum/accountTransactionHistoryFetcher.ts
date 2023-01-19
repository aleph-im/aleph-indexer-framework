import { BaseHistoryFetcher } from '../base/baseFetcher.js'
import {
  BaseFetcherJobState,
  BaseFetcherOptions,
  BaseFetcherPaginationCursors,
  BaseFetcherState,
  FetcherJobRunnerHandleFetchResult,
} from '../base/types.js'
import {
  EthereumFetchSignaturesOptions,
  EthereumTransactionHistoryFetcherOptions,
  EthereumAccountTransactionHistoryPaginationCursor,
} from './types.js'
import { FetcherStateLevelStorage } from '../base/dal/fetcherState.js'
import { EthereumClient } from '../../rpc/index.js'
import { EthereumBlockHistoryFetcher } from './blockHistoryFetcher.js'
import { JobRunnerReturnCode } from '../../utils/index.js'

/**
 * Handles the fetching and processing of signatures on an account.
 */
export class EthereumAccountTransactionHistoryFetcher extends BaseHistoryFetcher<EthereumAccountTransactionHistoryPaginationCursor> {
  protected forwardAutoInterval = false
  protected forwardRatio = 0
  protected forwardRatioThreshold = 0

  /**
   * Initialize the SignaturesFetcher class.
   * @param opts Fetcher options.
   * @param fetcherStateDAL Fetcher state storage.
   * @param ethereumClient The ethereum client to use.
   * @param ethereumBlockFetcher The ethereum client
   */
  constructor(
    protected opts: EthereumTransactionHistoryFetcherOptions,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumAccountTransactionHistoryPaginationCursor>,
    protected ethereumClient: EthereumClient,
    protected ethereumBlockFetcher: EthereumBlockHistoryFetcher,
  ) {
    const forward = typeof opts.forward === 'boolean' ? {} : opts.forward
    const backward = typeof opts.backward === 'boolean' ? {} : opts.backward

    const config: BaseFetcherOptions<EthereumAccountTransactionHistoryPaginationCursor> =
      { id: `ethereum:account-signature-history:${opts.account}` }

    if (forward) {
      config.jobs = config.jobs || {}
      config.jobs.forward = {
        ...forward,
        interval: forward.interval || 1000 * 10,
        intervalMax: forward.intervalMax || 1000 * 10,
        handleFetch: () => this.fetchForward(),
        checkComplete: async () => false,
      }
    }

    if (backward) {
      config.jobs = config.jobs || {}
      config.jobs.backward = {
        ...backward,
        interval: backward.interval || 0,
        handleFetch: (...args) => this.fetchBackward(...args),
        checkComplete: (ctx) => this.checkCompleteBackward(ctx),
      }
    }

    super(config, fetcherStateDAL)
  }

  getNextRun(fetcherType?: 'forward' | 'backward'): number {
    // @note: If the block store is not completely synced, ignore backward job and focus on forward job times
    if (!this.ethereumBlockFetcher.isComplete('backward')) {
      return super.getNextRun('forward')
    }

    return super.getNextRun(fetcherType)
  }

  protected async fetchForward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumAccountTransactionHistoryPaginationCursor>
  > {
    const { account } = this.opts
    const forward =
      typeof this.opts.forward === 'boolean' ? {} : this.opts.forward

    // @note: not "before" (autodetected by the client (last block height))
    const until = this.fetcherState.cursors?.forward?.height
    const iterationLimit = !until
      ? 1000
      : forward?.iterationFetchLimit || Number.MAX_SAFE_INTEGER

    const options: EthereumFetchSignaturesOptions = {
      before: undefined,
      account,
      until,
      iterationLimit,
    }

    const { lastCursors, error } = await this.fetchSignatures(options, true)
    return { lastCursors, error }
  }

  protected async fetchBackward({
    interval,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumAccountTransactionHistoryPaginationCursor>
  > {
    const { account } = this.opts
    const backward =
      typeof this.opts.backward === 'boolean' ? {} : this.opts.backward

    // @note: until is autodetected by the client (height 0 / first block)
    let before = this.fetcherState.cursors?.backward?.height

    if (!before) {
      const blockState = await this.ethereumBlockFetcher.getState()
      before = blockState.cursors?.forward?.height
    }

    const iterationLimit =
      backward?.iterationFetchLimit || Number.MAX_SAFE_INTEGER

    const options: EthereumFetchSignaturesOptions = {
      until: undefined,
      before,
      account,
      iterationLimit,
    }

    const { lastCursors, error, count } = await this.fetchSignatures(
      options,
      false,
    )

    const newInterval =
      error || count === 0 ? interval + 1000 : JobRunnerReturnCode.Reset

    return { lastCursors, error, newInterval }
  }

  protected async fetchSignatures(
    options: EthereumFetchSignaturesOptions,
    goingForward: boolean,
  ): Promise<{
    error?: Error
    count: number
    lastCursors: BaseFetcherPaginationCursors<EthereumAccountTransactionHistoryPaginationCursor>
  }> {
    const { account } = options

    let error: undefined | Error
    let count = 0
    let lastCursors: BaseFetcherPaginationCursors<EthereumAccountTransactionHistoryPaginationCursor> =
      {}

    console.log(`
      fetchSignatures [${goingForward ? 'forward' : 'backward'}] { 
        account: ${account}
      }
    `)

    try {
      const signatures = this.ethereumClient.fetchSignatures(options)

      for await (const step of signatures) {
        const { chunk } = step

        await this.opts.indexSignatures(chunk, goingForward)

        count += chunk.length
        lastCursors = step.cursors
      }
    } catch (e) {
      error = e as Error
    }

    return {
      error,
      count,
      lastCursors,
    }
  }

  protected async checkCompleteBackward(ctx: {
    fetcherState: BaseFetcherState<EthereumAccountTransactionHistoryPaginationCursor>
    jobState: BaseFetcherJobState
    newItems: boolean
    error?: Error
  }): Promise<boolean> {
    const { newItems, error, fetcherState } = ctx
    const isBlockComplete = this.ethereumBlockFetcher.isComplete('backward')
    const fetcherBackward = fetcherState.cursors?.backward?.height

    return (
      isBlockComplete &&
      !newItems &&
      !error &&
      fetcherBackward !== undefined &&
      fetcherBackward <= 0
    )
  }
}
