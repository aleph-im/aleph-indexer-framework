import { EthereumClient } from '../../rpc/ethereum/client.js'
import { FetcherStateLevelStorage } from '../base/dal/fetcherState.js'
import { JobRunnerReturnCode } from '../../utils/concurrence/index.js'
import { BaseHistoryFetcher } from '../base/baseFetcher.js'
import {
  BaseFetcherJobState,
  BaseFetcherOptions,
  BaseFetcherState,
  FetcherJobRunnerHandleFetchResult,
} from '../base/types.js'
import {
  EthereumBlockFetcherOptions,
  EthereumBlockHistoryPaginationCursor,
  EthereumBlockHistoryPaginationCursors,
  EthereumFetchBlocksOptions,
} from './types.js'

export class EthereumBlockHistoryFetcher extends BaseHistoryFetcher<EthereumBlockHistoryPaginationCursor> {
  protected lastCheckCompleteBackward = Date.now()
  protected backwardChunkSize = 50

  constructor(
    protected opts: EthereumBlockFetcherOptions,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumBlockHistoryPaginationCursor>,
    protected ethereumClient: EthereumClient,
  ) {
    const forward = typeof opts.forward === 'boolean' ? {} : opts.forward
    const backward = typeof opts.backward === 'boolean' ? {} : opts.backward
    const blockTime = 10 + 2

    const config: BaseFetcherOptions<EthereumBlockHistoryPaginationCursor> = {
      id: `ethereum:block-history`,
    }

    if (forward) {
      config.jobs = config.jobs || {}
      config.jobs.forward = {
        ...forward,
        interval: forward.interval || 1000 * blockTime,
        intervalMax: forward.intervalMax || 1000 * blockTime,
        handleFetch: () => this.runForward(),
        checkComplete: async () => false,
      }
    }

    if (backward) {
      config.jobs = config.jobs || {}
      config.jobs.backward = {
        ...backward,
        interval: backward.interval || 0,
        handleFetch: () => this.runBackward(),
        checkComplete: (ctx) => this.checkCompleteBackward(ctx),
      }
    }

    super(config, fetcherStateDAL)
  }

  protected async runForward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumBlockHistoryPaginationCursor>
  > {
    // @note: not "before" (autodetected by the node (last block height))
    const until = this.fetcherState.cursors?.forward?.height
    const maxLimit = !until ? this.backwardChunkSize : Number.MAX_SAFE_INTEGER

    const options: EthereumFetchBlocksOptions = {
      before: undefined,
      until,
      maxLimit,
    }

    const { lastCursors, error } = await this.fetchBlocks(options, true)

    return { lastCursors, error }
  }

  protected async runBackward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumBlockHistoryPaginationCursor>
  > {
    // @note: until is autodetected by the node (height 0 / first block)
    const before = this.fetcherState.cursors?.backward?.height
    const maxLimit = this.backwardChunkSize

    const options: EthereumFetchBlocksOptions = {
      until: undefined,
      before,
      maxLimit,
    }

    const { lastCursors, error } = await this.fetchBlocks(options, false)

    // @note: Stop the indexer if there wasnt more items
    const stop = !error && !lastCursors?.backward?.height
    const newInterval = stop ? JobRunnerReturnCode.Stop : undefined

    return { newInterval, lastCursors, error }
  }

  protected async fetchBlocks(
    options: EthereumFetchBlocksOptions,
    goingForward: boolean,
  ): Promise<{
    error?: Error
    lastCursors: EthereumBlockHistoryPaginationCursors
  }> {
    let error: undefined | Error
    let lastCursors: EthereumBlockHistoryPaginationCursors = {}

    console.log(`fetchBlocks [${goingForward ? 'forward' : 'backward'}]`)

    try {
      const blocks = this.ethereumClient.fetchBlocks(options)

      for await (const step of blocks) {
        const { chunk } = step

        await this.opts.indexBlocks(chunk, goingForward)

        lastCursors = step.cursors
      }
    } catch (e) {
      error = e as Error
    }

    return {
      error,
      lastCursors,
    }
  }

  protected async checkCompleteBackward(ctx: {
    fetcherState: BaseFetcherState<EthereumBlockHistoryPaginationCursor>
    jobState: BaseFetcherJobState
    newItems: boolean
    error?: Error
  }): Promise<boolean> {
    const { fetcherState, error } = ctx
    if (error) return false

    const firstHeight = Number(fetcherState?.cursors?.backward?.height)
    const lastHeight = Number(fetcherState?.cursors?.forward?.height)

    const progress = Number(
      (lastHeight > 0 ? (lastHeight - firstHeight) / lastHeight : 0) * 100,
    ).toFixed(4)

    const now = Date.now()
    const elapsedHours = (now - this.lastCheckCompleteBackward) / 1000 / 3600
    this.lastCheckCompleteBackward = now

    // Duration.fromMillis((firstHeight / 1000) * 20 * 1000).toISOTime() || '+24h'
    const estimatedTime = Number(
      (firstHeight / this.backwardChunkSize) * elapsedHours,
    ).toFixed(2)

    console.log(`${this.options.id} progress {
      firstHeight: ${firstHeight}
      lastHeight: ${lastHeight}
      progress: ${progress}%
      estimated time: ${estimatedTime}h
    }`)

    return !error && firstHeight === 0
  }
}
