import { promisify } from 'node:util'
import Web3 from 'web3'
import { errors } from 'web3-core-helpers'
import {
  EthereumBlockPaginationResponse,
  EthereumFetchBlocksOptions,
  EthereumFetchSignaturesOptions,
  EthereumTransactionHistoryPaginationResponse,
} from '../../fetcher/ethereum/index.js'
import {
  EthereumBlock,
  EthereumRawTransaction,
  EthereumSignature,
} from '../../types/ethereum.js'
import {
  EthereumAccountTransactionHistoryDALIndex,
  EthereumAccountTransactionHistoryStorage,
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
  // retries?: number
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
    protected accountSignatureDAL: EthereumAccountTransactionHistoryStorage,
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
      iterationLimit = 1000,
      pageLimit = 1000,
    } = args

    while (iterationLimit > 0) {
      const limit = Math.min(iterationLimit, pageLimit)
      iterationLimit = iterationLimit - limit

      console.log(`
        fetch blocks { 
          before: ${before}
          until: ${until}
          iterationLimit: ${iterationLimit}
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
  ): AsyncGenerator<EthereumTransactionHistoryPaginationResponse> {
    let firstKey
    let lastKey

    const { account, until = -1 } = args

    let {
      before = (await this.sdk.eth.getBlockNumber()) + 1,
      iterationLimit = 1000,
      pageLimit = 1000,
    } = args

    while (iterationLimit > 0) {
      const limit = Math.min(iterationLimit, pageLimit)
      iterationLimit = iterationLimit - limit

      console.log(`
        fetch signatures { 
          account: ${account}
          before: ${before}
          until: ${until}
          iterationLimit: ${iterationLimit}
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
  }: EthereumBlocksChunkOptions): Promise<EthereumBlocksChunkResponse> {
    const length = Math.min(limit, Math.max(before - (until + 1), 0))
    if (length === 0) throw new Error('Invalid block chunk range')

    const cursor = before - 1
    const now = Date.now() / 1000

    const heights = Array.from({ length }).map((_, i) => cursor - i)
    const chunk = await this.getBlocks(heights, true)

    const count = chunk.length
    const lastItem = chunk[0]
    const firstItem = chunk[chunk.length - 1]

    if (chunk.length > 0)
      console.log(
        'block chunk => ',
        chunk.length,
        chunk[chunk.length - 1].number,
        chunk[0].number,
        `${Number(Date.now() / 1000 - now).toFixed(4)} secs`,
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

  // @note: Take a look at:
  // https://github.com/web3/web3.js/blob/1.x/packages/web3-core-method/src/index.js#L847
  // https://github.com/web3/web3.js/blob/1.x/packages/web3-core-requestmanager/src/index.js#L196
  protected async getBlocks(
    blockHashOrBlockNumber: (number | string)[],
    returnTransactionObjects = true,
  ): Promise<EthereumBlock[]> {
    const method = (this.sdk.eth.getBlock as any).method

    const payload = blockHashOrBlockNumber.map((blockNumber) =>
      method.toPayload([blockNumber, returnTransactionObjects]),
    )

    const sendBatch = promisify(
      method.requestManager.sendBatch.bind(method.requestManager),
    )

    const results = await sendBatch(payload)
    const items = this.processJsonRpcResult(results)
    const output = method.formatOutput(items)

    return output
  }

  protected async getBlocksInParallel(
    blockHashOrBlockNumber: (number | string)[],
    retries = 2,
  ): Promise<EthereumBlock[]> {
    const chunk = await Promise.all(
      blockHashOrBlockNumber.map(async (height) => {
        let block
        let ret = retries

        while (!block && ret-- >= 0) {
          block = await this.sdk.eth.getBlock(height, true)
        }

        if (!block) throw new Error(`Invalid block ${height}`)

        return block
      }),
    )

    return chunk
  }

  protected processJsonRpcResult<
    T extends { error?: Error; jsonrpc: string; id: string; result: any },
  >(result: T | T[]): T | T[] {
    const isArray = Array.isArray(result)
    const messages = isArray ? result : [result]
    const output = []

    for (const message of messages) {
      if (message && message.error) {
        throw errors.ErrorResponse(message as unknown as Error)
      }

      if (
        !message ||
        message.error ||
        message.jsonrpc !== '2.0' ||
        (typeof message.id !== 'number' && typeof message.id !== 'string') ||
        message.result === undefined ||
        message.result === null
      ) {
        throw errors.InvalidResponse(result as unknown as Error)
      }

      output.push(message.result)
    }

    return isArray ? output : output[0]
  }

  protected async getSignaturesChunk({
    account,
    before,
    until,
    limit,
  }: EthereumSignaturesChunkOptions): Promise<EthereumSignaturesChunkResponse> {
    if (before <= 0 || until >= before)
      throw new Error('Invalid signature chunk range')

    before = before - 1
    until = until + 1

    const chunk = []

    const signatures = await this.accountSignatureDAL
      .useIndex(EthereumAccountTransactionHistoryDALIndex.AccountHeightIndex)
      .getAllValuesFromTo([account, until], [account, before], {
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
