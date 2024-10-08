import {
  BaseFetcherJobState,
  BaseFetcherState,
  BaseHistoryFetcher,
  BlockchainId,
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

export type EthereumBlockHistoryFetcherConfig = {
  indexRawBlocks?: boolean
  indexAccountTransactionHistory?: boolean
  indexAccountLogHistory?: boolean
  blockTime?: number
}

export class EthereumBlockHistoryFetcher extends BaseHistoryFetcher<EthereumBlockHistoryPaginationCursor> {
  protected lastCheckCompleteBackward = Date.now()
  protected iterationLimit = 1000
  protected pageLimit = 50

  constructor(
    protected blockchainId: BlockchainId,
    protected config: EthereumBlockHistoryFetcherConfig,
    protected ethereumClient: EthereumClient,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumBlockHistoryPaginationCursor>,
    protected blockDAL: EthereumRawBlockStorage,
  ) {
    const blockTime = config.blockTime || (10 + 2) * 1000

    super(
      {
        id: `${blockchainId}:block-history`,
        jobs: {
          forward: {
            interval: blockTime,
            intervalMax: blockTime,
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
    const forwardCursor = this.fetcherState.cursors?.forward
    const fromBlock = forwardCursor ? forwardCursor.height + 1 : 0
    const toBlock = await this.ethereumClient.getLastBlockNumber()

    const { pageLimit } = this
    const iterationLimit = !fromBlock
      ? this.iterationLimit
      : Number.MAX_SAFE_INTEGER

    const options: EthereumFetchBlocksOptions = {
      toBlock,
      fromBlock,
      iterationLimit,
      pageLimit,
    }

    return await this.fetchBlockHistory(options, true)
  }

  protected async runBackward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumBlockHistoryPaginationCursor>
  > {
    const backwardCursor = this.fetcherState.cursors?.backward
    const fromBlock = 0
    const toBlock = backwardCursor
      ? backwardCursor.height - 1
      : await this.ethereumClient.getLastBlockNumber()

    const { iterationLimit, pageLimit } = this

    const options: EthereumFetchBlocksOptions = {
      fromBlock,
      toBlock,
      iterationLimit,
      pageLimit,
    }

    return await this.fetchBlockHistory(options, false)
  }

  protected async fetchBlockHistory(
    options: EthereumFetchBlocksOptions,
    goingForward: boolean,
  ): Promise<{
    error?: Error
    lastCursors: EthereumBlockHistoryPaginationCursors
  }> {
    let error: undefined | Error
    let lastCursors: EthereumBlockHistoryPaginationCursors = {}

    console.log(
      `${this.blockchainId} fetchBlocks [${
        goingForward ? 'forward' : 'backward'
      }]`,
    )

    if (options.fromBlock > options.toBlock) return { lastCursors }

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
    const promises = []

    if (this.config.indexRawBlocks) {
      promises.push(this.blockDAL.save(blocks))
    }

    if (this.config.indexAccountTransactionHistory) {
      promises.push(this.ethereumClient.indexBlockAccountTransactions(blocks))
    }

    if (this.config.indexAccountLogHistory) {
      promises.push(this.ethereumClient.indexBlockLogBloom(blocks))
    }

    await Promise.all(promises)
  }
}
