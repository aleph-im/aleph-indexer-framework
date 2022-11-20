import { EthereumClient } from '../../rpc/ethereum/client.js'
import { FetcherStateLevelStorage } from '../../storage/fetcherState.js'
import { JobRunnerReturnCode } from '../../utils/concurrence/index.js'
import { BaseFetcher } from '../base/baseFetcher.js'
import {
  FetcherJobRunnerHandleFetchResult,
  FetcherJobRunnerUpdateCursorResult,
} from '../base/types.js'
import {
  EthereumBlockFetcherOptions,
  EthereumFetcherCursor,
  EthereumFetchBlocksOptions,
} from './types.js'

export class EthereumBlockFetcher extends BaseFetcher<EthereumFetcherCursor> {
  constructor(
    protected opts: EthereumBlockFetcherOptions<EthereumFetcherCursor>,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumFetcherCursor>,
    protected ethereumRpc: EthereumClient,
  ) {
    super(
      {
        id: `eth:blocks`,
        forward: opts.forward
          ? {
              ...opts.forward,
              interval: opts.forward.interval || 0,
              handleFetch: (ctx) => this.runForward(ctx),
              updateCursor: (ctx) => this.updateCursor(ctx),
            }
          : undefined,
        backward: opts.backward
          ? {
              ...opts.backward,
              handleFetch: (ctx) => this.runBackward(ctx),
              updateCursor: (ctx) => this.updateCursor(ctx),
            }
          : undefined,
      },
      fetcherStateDAL,
    )
  }

  protected async runForward({
    firstRun,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<FetcherJobRunnerHandleFetchResult<EthereumFetcherCursor>> {
    // @note: not "before" (autodetected by the node (last block height))
    const { lastHeight: until } = this.fetcherState.cursor || {}

    const maxLimit = !until || firstRun ? 1000 : Number.MAX_SAFE_INTEGER

    const options: EthereumFetchBlocksOptions = {
      before: undefined,
      until,
      maxLimit,
    }

    const { lastCursor, error } = await this.fetchBlocks(options, true)

    return { lastCursor, error }
  }

  protected async runBackward({
    interval,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<FetcherJobRunnerHandleFetchResult<EthereumFetcherCursor>> {
    // @note: until is autodetected by the node (height 0 / first block)
    const before = this.fetcherState.cursor?.firstHeight
    const maxLimit = Number.MAX_SAFE_INTEGER

    const options: EthereumFetchBlocksOptions = {
      until: undefined,
      before,
      maxLimit,
    }

    const { lastCursor, error } = await this.fetchBlocks(options, false)

    // @note: Stop the indexer if there wasnt more items
    const stop = !error && !lastCursor?.firstHeight
    const newInterval = stop ? JobRunnerReturnCode.Stop : interval

    return { newInterval, lastCursor, error }
  }

  protected async fetchBlocks(
    options: EthereumFetchBlocksOptions,
    goingForward: boolean,
  ): Promise<{
    error?: Error
    lastCursor: EthereumFetcherCursor
  }> {
    let error: undefined | Error
    const lastCursor: EthereumFetcherCursor = {}

    console.log(`fetchBlocks [${goingForward ? 'forward' : 'backward'}]`)

    try {
      const blocks = this.ethereumRpc.fetchBlocks(options)

      for await (const step of blocks) {
        const { chunk } = step

        await this.opts.indexBlocks(chunk, goingForward)

        lastCursor.firstHeight = step.firstKey?.height
        lastCursor.firstTimestamp = step.firstKey?.timestamp
        lastCursor.lastHeight = step.lastKey?.height
        lastCursor.lastTimestamp = step.lastKey?.timestamp
      }
    } catch (e) {
      error = e as Error
    }

    return {
      error,
      lastCursor,
    }
  }

  protected async updateCursor({
    type,
    prevCursor,
    lastCursor,
  }: {
    type: 'forward' | 'backward'
    prevCursor?: EthereumFetcherCursor
    lastCursor: EthereumFetcherCursor
  }): Promise<FetcherJobRunnerUpdateCursorResult<EthereumFetcherCursor>> {
    let newItems = false
    const newCursor: EthereumFetcherCursor = { ...prevCursor }

    switch (type) {
      case 'backward': {
        if (lastCursor.firstHeight) {
          newCursor.firstHeight = lastCursor.firstHeight
          newCursor.firstTimestamp = lastCursor.firstTimestamp
          newItems = true
        }

        if (!prevCursor?.lastHeight) {
          newCursor.lastHeight = lastCursor.lastHeight
          newCursor.lastTimestamp = lastCursor.lastTimestamp
        }

        break
      }
      case 'forward': {
        if (lastCursor.lastHeight) {
          newCursor.lastHeight = lastCursor.lastHeight
          newCursor.lastTimestamp = lastCursor.lastTimestamp
          newItems = true
        }

        if (!prevCursor?.firstHeight) {
          newCursor.firstHeight = lastCursor.firstHeight
          newCursor.firstTimestamp = lastCursor.firstTimestamp
        }

        break
      }
    }

    return { newCursor, newItems }
  }
}
