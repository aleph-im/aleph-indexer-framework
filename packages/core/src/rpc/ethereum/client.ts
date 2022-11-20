import Web3 from 'web3'
import { BlockTransactionObject } from 'web3-eth'
import { EthereumFetchBlocksOptions } from '../../fetcher/ethereum.js'

export interface EthereumPaginationCursor {
  height: number
  timestamp: number
}

export interface EthereumClientOptions {
  url: string
  rateLimit?: boolean
}

export type EthereumBlocksChunkOptions = {
  limit: number
  before: number
  until: number
  concurrency?: number
}

export type EthereumOptimizedHistoryResponse = {
  chunk: BlockTransactionObject[]
  firstItem?: BlockTransactionObject
  lastItem?: BlockTransactionObject
  count: number
}

export class EthereumClient {
  protected sdk: Web3
  protected rateLimit = false

  constructor(options: EthereumClientOptions) {
    this.sdk = new Web3(options.url)
    this.rateLimit = options.rateLimit || false
  }

  getSDK(): Web3 {
    return this.sdk
  }

  async *fetchBlocks(args: EthereumFetchBlocksOptions): AsyncGenerator<{
    firstKey: undefined | EthereumPaginationCursor
    lastKey: undefined | EthereumPaginationCursor
    chunk: any[]
  }> {
    let firstKey
    let lastKey

    const { until = 0 } = args
    let {
      before = (await this.sdk.eth.getBlockNumber()) + 1,
      maxLimit = 1000,
    } = args

    while (maxLimit > 0) {
      const limit = Math.min(maxLimit, 1000)
      maxLimit = maxLimit - limit

      console.log(`
        fetch blocks { 
          before: ${before}
          until: ${until}
          maxLimit: ${maxLimit}
        }
      `)

      const { chunk, count, firstItem, lastItem } = await this.getBlocksChunk({
        limit,
        before,
        until,
      })

      if (count === 0) break

      if (!lastKey && lastItem) {
        lastKey = {
          height: lastItem.number,
          timestamp: Number(lastItem.timestamp),
        }
      }

      if (firstItem) {
        firstKey = {
          height: firstItem.number,
          timestamp: Number(firstItem.timestamp),
        }
      }

      yield { chunk, firstKey, lastKey }

      if (count < limit) break

      before = firstKey?.height as number
    }
  }

  protected async getBlocksChunk({
    before,
    until,
    limit,
  }: EthereumBlocksChunkOptions): Promise<EthereumOptimizedHistoryResponse> {
    const size = Math.min(limit, before - until)
    let cursor = before - 1

    const chunk = await Promise.all(
      Array.from({ length: size }).map((_, i) =>
        this.sdk.eth.getBlock(cursor - i, true),
      ),
    )

    const lastItem = chunk[0]
    const firstItem = chunk[chunk.length - 1]
    const count = chunk.length
    cursor -= chunk.length

    return {
      chunk,
      count,
      firstItem,
      lastItem,
    }
  }
}
