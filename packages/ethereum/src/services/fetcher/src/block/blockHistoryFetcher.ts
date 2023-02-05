import { Utils } from '@aleph-indexer/core'
import {
  BaseFetcherJobState,
  BaseFetcherState,
  BaseHistoryFetcher,
  Blockchain,
  FetcherJobRunnerHandleFetchResult,
  FetcherStateLevelStorage,
} from '@aleph-indexer/framework'
import {
  EthereumBlockHistoryPaginationCursor,
  EthereumBlockHistoryPaginationCursors,
  EthereumFetchBlocksOptions,
} from '../types.js'
import { EthereumRawBlockStorage } from './dal/rawBlock.js'
import { EthereumClient } from '../../../../sdk/client.js'
import { EthereumRawBlock } from '../../../../types.js'

const { JobRunnerReturnCode } = Utils

export class EthereumBlockHistoryFetcher extends BaseHistoryFetcher<EthereumBlockHistoryPaginationCursor> {
  protected lastCheckCompleteBackward = Date.now()
  protected iterationLimit = 1000
  protected pageLimit = 50

  constructor(
    protected ethereumClient: EthereumClient,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumBlockHistoryPaginationCursor>,
    protected blockDAL?: EthereumRawBlockStorage,
    protected blockchainId: Blockchain = Blockchain.Ethereum,
  ) {
    const blockTime = 10 + 2

    super(
      {
        id: `${blockchainId}:block-history`,
        jobs: {
          forward: {
            interval: 1000 * blockTime,
            intervalMax: 1000 * blockTime,
            handleFetch: () => this.runForward(),
            checkComplete: async () => false,
          },
          backward: {
            interval: 0,
            handleFetch: () => this.runBackward(),
            checkComplete: (ctx) => this.checkCompleteBackward(ctx),
          },
        },
      },
      fetcherStateDAL,
    )
  }

  protected async runForward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumBlockHistoryPaginationCursor>
  > {
    // @note: not "before" (autodetected by the node (last block height))
    const until = this.fetcherState.cursors?.forward?.height
    const { pageLimit } = this
    const iterationLimit = !until
      ? this.iterationLimit
      : Number.MAX_SAFE_INTEGER

    const options: EthereumFetchBlocksOptions = {
      before: undefined,
      until,
      iterationLimit,
      pageLimit,
    }

    const { lastCursors, error } = await this.fetchBlocks(options, true)

    return { lastCursors, error }
  }

  protected async runBackward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumBlockHistoryPaginationCursor>
  > {
    // @note: until is autodetected by the node (height 0 / first block)
    const before = this.fetcherState.cursors?.backward?.height
    const { iterationLimit, pageLimit } = this

    const options: EthereumFetchBlocksOptions = {
      until: undefined,
      before,
      iterationLimit,
      pageLimit,
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

    console.log(
      `ethereum fetchBlocks [${goingForward ? 'forward' : 'backward'}]`,
    )

    try {
      const blocks = this.ethereumClient.fetchBlockHistory(options)

      for await (const step of blocks) {
        const { chunk } = step

        await this.indexBlocks(chunk, goingForward)

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
      (firstHeight / this.iterationLimit) * elapsedHours,
    ).toFixed(2)

    console.log(`${this.options.id} progress {
      firstHeight: ${firstHeight}
      lastHeight: ${lastHeight}
      progress: ${progress}%
      estimated time: ${estimatedTime}h
    }`)

    return !error && firstHeight === 0
  }

  protected async indexBlocks(
    blocks: EthereumRawBlock[],
    goingForward: boolean,
  ): Promise<void> {
    if (!blocks.length) return

    if (this.blockDAL) {
      await this.blockDAL.save(blocks)
    }

    await Promise.all([
      this.ethereumClient.indexBlockSignatures(blocks),
      this.ethereumClient.indexBlockLogBloom(blocks),
    ])
  }
}
