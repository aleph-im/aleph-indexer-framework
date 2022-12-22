import Web3 from 'web3'
import {
  EthereumBlockPaginationResponse,
  EthereumFetchBlocksOptions,
  EthereumFetchSignaturesOptions,
  EthereumSignaturePaginationResponse,
} from '../../fetcher/ethereum/index.js'
import {
  EthereumBlock,
  EthereumRawTransaction,
  EthereumSignature,
} from '../../types/ethereum.js'
import {
  EthereumAccountSignatureDALIndex,
  EthereumAccountSignatureStorage,
} from './dal.js'

// Common

export interface EthereumClientOptions {
  url: string
  dbPath: string
  rateLimit?: boolean
  indexBlockSignatures?: boolean
}

// Blocks

export type EthereumBlocksChunkOptions = {
  limit: number
  before: number
  until: number
  retries?: number
}

export type EthereumBlocksChunkResponse = {
  chunk: EthereumBlock[]
  firstItem?: EthereumBlock
  lastItem?: EthereumBlock
  count: number
}

// Signatures

export type EthereumSignaturesChunkOptions = {
  account: string
  limit: number
  before: number
  until: number
}

export type EthereumSignaturesChunkResponse = {
  chunk: EthereumSignature[]
  firstItem?: EthereumSignature
  lastItem?: EthereumSignature
  count: number
}

export class EthereumClient {
  protected sdk: Web3

  constructor(
    protected options: EthereumClientOptions,
    protected accountSignatureDAL: EthereumAccountSignatureStorage,
  ) {
    this.sdk = new Web3(options.url)
  }

  getSDK(): Web3 {
    return this.sdk
  }

  getBalance(account: string): Promise<string> {
    return this.sdk.eth.getBalance(account)
  }

  getTransactions(
    signatures: string[],
    options?: { shallowErrors?: boolean },
  ): Promise<(EthereumRawTransaction | null)[]> {
    return Promise.all(
      signatures.map(async (signature) => {
        try {
          const tx = (await this.sdk.eth.getTransaction(
            signature,
          )) as EthereumRawTransaction | null

          if (tx) tx.signature = tx.hash

          return tx
        } catch (error) {
          if (options?.shallowErrors) {
            console.log(error)
            return null
          }

          throw error
        }
      }),
    )
  }

  async *fetchBlocks(
    args: EthereumFetchBlocksOptions,
  ): AsyncGenerator<EthereumBlockPaginationResponse> {
    let firstKey
    let lastKey

    const { until = -1 } = args

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
          signature: lastItem.hash,
        }
      }

      if (firstItem) {
        firstKey = {
          height: firstItem.number,
          timestamp: Number(firstItem.timestamp),
          signature: firstItem.hash,
        }
      }

      yield { chunk, cursors: { backward: firstKey, forward: lastKey } }

      if (count < limit) break

      before = firstKey?.height as number
    }
  }

  async *fetchSignatures(
    args: EthereumFetchSignaturesOptions,
  ): AsyncGenerator<EthereumSignaturePaginationResponse> {
    let firstKey
    let lastKey

    const { account, until = -1 } = args

    let {
      before = (await this.sdk.eth.getBlockNumber()) + 1,
      maxLimit = 1000,
    } = args

    while (maxLimit > 0) {
      const limit = Math.min(maxLimit, 1000)
      maxLimit = maxLimit - limit

      console.log(`
        fetch signatures { 
          account: ${account}
          before: ${before}
          until: ${until}
          maxLimit: ${maxLimit}
        }
      `)

      const { chunk, count, firstItem, lastItem } =
        await this.getSignaturesChunk({
          account,
          limit,
          before,
          until,
        })

      if (count === 0) break

      if (!lastKey && lastItem) {
        lastKey = {
          height: lastItem.height,
          timestamp: Number(lastItem.timestamp),
          signature: lastItem.signature,
        }
      }

      if (firstItem) {
        firstKey = {
          height: firstItem.height,
          timestamp: Number(firstItem.timestamp),
          signature: firstItem.signature,
        }
      }

      yield { chunk, cursors: { backward: firstKey, forward: lastKey } }

      if (count < limit) break

      before = firstKey?.height as number
    }
  }

  async indexBlockSignatures(blocks: EthereumBlock[]): Promise<void> {
    const signatures = blocks.flatMap((block) =>
      block.transactions.map((tx) => {
        const accounts = [tx.from]
        if (tx.to) accounts.push(tx.to)

        const sig: EthereumSignature = {
          signature: tx.hash,
          height: block.number,
          timestamp: Number(block.timestamp),
          index: tx.transactionIndex as number,
          accounts,
        }

        return sig
      }),
    )

    await this.accountSignatureDAL.save(signatures)
  }

  protected async getBlocksChunk({
    before,
    until,
    limit,
    retries = 1,
  }: EthereumBlocksChunkOptions): Promise<EthereumBlocksChunkResponse> {
    const size = Math.min(limit, Math.max(before - (until + 1), 0))
    const cursor = before - 1

    const chunk = await Promise.all(
      Array.from({ length: size }).map(async (_, i) => {
        const height = cursor - i
        let block
        let ret = retries

        while (!block && ret-- >= 0) {
          block = await this.sdk.eth.getBlock(height, true)
        }

        if (!block) throw new Error(`Invalid block ${height}`)

        return block
      }),
    )

    const count = chunk.length
    const lastItem = chunk[0]
    const firstItem = chunk[chunk.length - 1]

    if (chunk.length > 0)
      console.log(
        'block chunk => ',
        chunk.length,
        chunk[chunk.length - 1].number,
        chunk[0].number,
      )

    if (this.options.indexBlockSignatures) {
      await this.indexBlockSignatures(chunk)
    }

    return {
      chunk,
      count,
      firstItem,
      lastItem,
    }
  }

  protected async getSignaturesChunk({
    account,
    before,
    until,
    limit,
  }: EthereumSignaturesChunkOptions): Promise<EthereumSignaturesChunkResponse> {
    const chunk = []

    const signatures = await this.accountSignatureDAL
      .useIndex(EthereumAccountSignatureDALIndex.AccountHeightIndex)
      .getAllValuesFromTo([account, before], [account, until], {
        atomic: true,
        limit,
      })

    for await (const sig of signatures) chunk.push(sig)

    const count = chunk.length
    const lastItem = chunk[0]
    const firstItem = chunk[chunk.length - 1]

    if (chunk.length > 0)
      console.log(
        'signature chunk => ',
        chunk.length,
        chunk[chunk.length - 1].height,
        chunk[0].height,
      )

    return {
      chunk,
      count,
      firstItem,
      lastItem,
    }
  }
}
