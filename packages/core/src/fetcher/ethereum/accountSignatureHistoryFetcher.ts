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
  EthereumSignatureFetcherOptions,
  EthereumAccountSignatureHistoryPaginationCursor,
} from './types.js'
import { FetcherStateLevelStorage } from '../base/dal/fetcherState.js'
import { EthereumClient } from '../../rpc/index.js'
import { EthereumBlockHistoryFetcher } from './blockHistoryFetcher.js'

/**
 * Handles the fetching and processing of signatures on an account.
 */
export class EthereumAccountSignatureHistoryFetcher extends BaseHistoryFetcher<EthereumAccountSignatureHistoryPaginationCursor> {
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
    protected opts: EthereumSignatureFetcherOptions,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumAccountSignatureHistoryPaginationCursor>,
    protected ethereumClient: EthereumClient,
    protected ethereumBlockFetcher: EthereumBlockHistoryFetcher,
  ) {
    const forward = typeof opts.forward === 'boolean' ? {} : opts.forward
    const backward = typeof opts.backward === 'boolean' ? {} : opts.backward

    const config: BaseFetcherOptions<EthereumAccountSignatureHistoryPaginationCursor> =
      {
        id: `ethereum:account-signature-history:${opts.account}`,
      }

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
        handleFetch: () => this.fetchBackward(),
        checkComplete: (ctx) => this.checkCompleteBackward(ctx),
      }
    }

    super(config, fetcherStateDAL)
  }

  protected async fetchForward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumAccountSignatureHistoryPaginationCursor>
  > {
    const { account } = this.opts

    // @note: not "before" (autodetected by the client (last block height))
    const until = this.fetcherState.cursors?.forward?.height
    const maxLimit = !until ? 1000 : Number.MAX_SAFE_INTEGER

    const options: EthereumFetchSignaturesOptions = {
      before: undefined,
      account,
      until,
      maxLimit,
    }

    const { lastCursors, error } = await this.fetchSignatures(options, true)
    return { lastCursors, error }
  }

  protected async fetchBackward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumAccountSignatureHistoryPaginationCursor>
  > {
    const { account } = this.opts

    // @note: until is autodetected by the client (height 0 / first block)
    const before = this.fetcherState.cursors?.backward?.height
    const maxLimit = Number.MAX_SAFE_INTEGER

    const options: EthereumFetchSignaturesOptions = {
      until: undefined,
      before,
      account,
      maxLimit,
    }

    const { lastCursors, error } = await this.fetchSignatures(options, false)
    return { lastCursors, error }
  }

  protected async fetchSignatures(
    options: EthereumFetchSignaturesOptions,
    goingForward: boolean,
  ): Promise<{
    error?: Error
    count: number
    lastCursors: BaseFetcherPaginationCursors<EthereumAccountSignatureHistoryPaginationCursor>
  }> {
    const { account } = options

    let error: undefined | Error
    let count = 0
    let lastCursors: BaseFetcherPaginationCursors<EthereumAccountSignatureHistoryPaginationCursor> =
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
    fetcherState: BaseFetcherState<EthereumAccountSignatureHistoryPaginationCursor>
    jobState: BaseFetcherJobState
    newItems: boolean
    error?: Error
  }): Promise<boolean> {
    const { newItems, error } = ctx
    const isBlockComplete = this.ethereumBlockFetcher.isComplete('backward')

    return isBlockComplete && !newItems && !error
  }
}
