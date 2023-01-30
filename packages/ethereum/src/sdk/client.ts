import { promisify } from 'node:util'
import ethers from 'ethers'
import Web3 from 'web3'
import { Transaction, Eth } from 'web3-eth'
import { errors } from 'web3-core-helpers'
import { Log, PastLogsOptions } from 'web3-core'
import {
  isUserEthereumAddressInBloom,
  isContractAddressInBloom,
} from 'ethereum-bloom-filters'
import { Keccak } from 'sha3'
import {
  EthereumBlock,
  EthereumRawLog,
  EthereumLogBloom,
  EthereumRawTransaction,
  EthereumSignature,
} from '../types.js'
import {
  EthereumAccountTransactionHistoryDALIndex,
  EthereumAccountTransactionHistoryStorage,
  EthereumLogBloomDALIndex,
  EthereumLogBloomStorage,
} from './dal.js'
import { EthereumParsedTransaction } from '../services/parser/src/types.js'
import {
  EthereumBlockPaginationResponse,
  EthereumFetchBlocksOptions,
  EthereumFetchLogsOptions,
  EthereumFetchSignaturesOptions,
  EthereumLogHistoryPaginationResponse,
  EthereumTransactionHistoryPaginationResponse,
} from '../services/fetcher/src/types.js'

// Common

export interface EthereumClientOptions {
  url: string
  rateLimit?: boolean
  indexBlockSignatures?: boolean
  indexBlockLogBloom?: boolean
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

// Transaction Signatures

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

// Logs

export type EthereumLogsChunkOptions = {
  account: string
  limit: number
  before: number
  until: number
  isContractAccount?: boolean
}

export type EthereumLogsChunkResponse = {
  chunk: EthereumRawLog[]
  firstItem?: { height: number; timestamp: number }
  lastItem?: { height: number; timestamp: number }
  count: number
}

// @note: Refactor to only use "ethers" and remove web3 deps
export class EthereumClient {
  protected sdk: Web3

  constructor(
    protected options: EthereumClientOptions,
    protected accountSignatureDAL?: EthereumAccountTransactionHistoryStorage,
    protected logBloomDAL?: EthereumLogBloomStorage,
  ) {
    this.sdk = new Web3(options.url)
  }

  getSDK(): Web3 {
    return this.sdk
  }

  getBalance(account: string): Promise<string> {
    return this.sdk.eth.getBalance(account)
  }

  // @note: Take a look at:
  // https://github.com/web3/web3.js/blob/1.x/packages/web3-core-method/src/index.js#L847
  // https://github.com/web3/web3.js/blob/1.x/packages/web3-core-requestmanager/src/index.js#L196
  async getTransactions(
    signatures: string[],
    options?: { swallowErrors: boolean },
  ): Promise<(EthereumRawTransaction | null)[]> {
    const args = signatures.map((signature) => [signature])

    const txs: (Transaction | null)[] = await this.batchRequest(
      'getTransaction',
      args,
      options,
    )

    return Promise.all(
      txs.map((tx) => this.completeTransactionsWithBlockInfo(tx)),
    )
  }

  async isContractAddress(address: string): Promise<boolean> {
    const code = await this.sdk.eth.getCode(address)
    if (code.length <= 2) return false

    return true
  }

  parseTransaction(
    rawTx: EthereumRawTransaction,
    abi?: any,
  ): EthereumParsedTransaction {
    if (!abi) return { ...rawTx, parsed: null }

    const iface = new ethers.utils.Interface(abi)

    const parsed = iface.parseTransaction({
      data: rawTx.input,
      value: rawTx.value,
    })

    return { ...rawTx, parsed }
  }

  async *fetchBlocks(
    args: EthereumFetchBlocksOptions,
  ): AsyncGenerator<EthereumBlockPaginationResponse> {
    let firstKey
    let lastKey

    const { until = -1, pageLimit = 1000 } = args

    let {
      before = (await this.sdk.eth.getBlockNumber()) + 1,
      iterationLimit = 1000,
    } = args

    // before = 16429404 + 1

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
          timestamp: Number(lastItem.timestamp) * 1000,
          signature: lastItem.hash,
        }
      }

      if (firstItem) {
        firstKey = {
          height: firstItem.number,
          timestamp: Number(firstItem.timestamp) * 1000,
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

    const { account, until = -1, pageLimit = 1000 } = args

    let {
      before = (await this.sdk.eth.getBlockNumber()) + 1,
      iterationLimit = 1000,
    } = args

    // before = 16429404 + 1

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
          timestamp: Number(lastItem.timestamp) * 1000,
          signature: lastItem.signature,
        }
      }

      if (firstItem) {
        firstKey = {
          height: firstItem.height,
          timestamp: Number(firstItem.timestamp) * 1000,
          signature: firstItem.signature,
        }
      }

      yield { chunk, cursors: { backward: firstKey, forward: lastKey } }

      if (count < limit) break

      before = firstKey?.height as number
    }
  }

  async *fetchLogs(
    args: EthereumFetchLogsOptions,
  ): AsyncGenerator<EthereumLogHistoryPaginationResponse> {
    let firstKey
    let lastKey

    const { account, until = -1, pageLimit = 1000, isContractAccount } = args

    let {
      before = (await this.sdk.eth.getBlockNumber()) + 1,
      iterationLimit = 1000,
    } = args

    while (iterationLimit > 0) {
      const limit = Math.min(iterationLimit, pageLimit)
      iterationLimit = iterationLimit - limit

      console.log(`
        fetch logs { 
          account: ${account}
          before: ${before}
          until: ${until}
          iterationLimit: ${iterationLimit}
        }
      `)

      const { chunk, count, firstItem, lastItem } = await this.getLogsChunk({
        account,
        limit,
        before,
        until,
        isContractAccount,
      })

      if (count === 0) break

      if (!lastKey && lastItem) {
        lastKey = {
          height: lastItem.height,
          timestamp: Number(lastItem.timestamp) * 1000,
        }
      }

      if (firstItem) {
        firstKey = {
          height: firstItem.height,
          timestamp: Number(firstItem.timestamp) * 1000,
        }
      }

      yield { chunk, cursors: { backward: firstKey, forward: lastKey } }

      if (count < limit) break

      before = firstKey?.height as number
    }
  }

  async indexBlockSignatures(blocks: EthereumBlock[]): Promise<void> {
    if (!this.accountSignatureDAL)
      throw new Error(
        'EthereumAccountTransactionHistoryStorage not provided to EthereumClient',
      )

    const signatures = blocks.flatMap((block) =>
      block.transactions.map((tx) => {
        const accounts = [tx.from]
        if (tx.to) accounts.push(tx.to)

        const sig: EthereumSignature = {
          id: tx.hash,
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

  async indexBlockLogBloom(blocks: EthereumBlock[]): Promise<void> {
    if (!this.logBloomDAL)
      throw new Error('EthereumLogBloomStorage not provided to EthereumClient')

    const logBlooms = blocks.map((block) => {
      return {
        logsBloom: block.logsBloom,
        height: block.number,
        timestamp: Number(block.timestamp),
      }
    })

    await this.logBloomDAL.save(logBlooms)
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

    if (this.options.indexBlockLogBloom) {
      await this.indexBlockLogBloom(chunk)
    }

    return {
      chunk,
      count,
      firstItem,
      lastItem,
    }
  }

  protected async getBlocks(
    blockHashOrBlockNumber: (number | string)[],
    returnTransactionObjects = true,
  ): Promise<EthereumBlock[]> {
    const args = blockHashOrBlockNumber.map((blockOrNum) => [
      blockOrNum,
      returnTransactionObjects,
    ])

    const blocks: EthereumBlock[] = await this.batchRequest('getBlock', args, {
      swallowErrors: false,
    })

    return blocks
  }

  protected async getLogs(
    blockHashOrBlockNumber: (number | string)[],
    address?: string,
  ): Promise<(EthereumRawLog | null)[]> {
    const args: PastLogsOptions[][] = blockHashOrBlockNumber.map(
      (blockOrNum) => [{ fromBlock: blockOrNum, toBlock: blockOrNum, address }],
    )

    const logs: Log[] = await this.batchRequest('getPastLogs', args, {
      swallowErrors: false,
    })

    return Promise.all(logs.map((log) => this.completeLogsWithBlockInfo(log)))
  }

  // @todo: Deprecated
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

  // @todo: Deprecated
  protected getTransactionsInParallel(
    signatures: string[],
    options?: { swallowErrors?: boolean },
  ): Promise<(EthereumRawTransaction | null)[]> {
    return Promise.all(
      signatures.map(async (signature) => {
        try {
          const tx = (await this.sdk.eth.getTransaction(
            signature,
          )) as Transaction | null

          return await this.completeTransactionsWithBlockInfo(tx)
        } catch (error) {
          if (!options?.swallowErrors) throw error

          console.log(error)
          return null
        }
      }),
    )
  }

  // @note: Take a look at:
  // https://github.com/web3/web3.js/blob/1.x/packages/web3-core-method/src/index.js#L847
  // https://github.com/web3/web3.js/blob/1.x/packages/web3-core-requestmanager/src/index.js#L196
  protected async batchRequest<
    T,
    A extends Array<unknown>,
    S extends boolean,
    R = S extends false ? T[] : (T | null)[],
  >(method: keyof Eth, args: A[], options?: { swallowErrors: S }): Promise<R> {
    const methodInstance = this.sdk.eth[method].method
    const payload = args.map((arg) => methodInstance.toPayload(arg))

    const sendBatch = promisify(
      methodInstance.requestManager.sendBatch.bind(
        methodInstance.requestManager,
      ),
    )

    const results = await sendBatch(payload)
    const items = this.processJsonRpcResult(results, options?.swallowErrors)
    return methodInstance.formatOutput(items)
  }

  protected processJsonRpcResult<
    T extends { error?: Error; jsonrpc: string; id: string; result: any },
  >(result: T | T[], swallowErrors = false): T | null | (T | null)[] {
    const isArray = Array.isArray(result)
    const messages = isArray ? result : [result]
    const output: (T | null)[] = []

    for (const message of messages) {
      let result: T | null

      try {
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
          throw errors.InvalidResponse(message as unknown as Error)
        }

        result = message.result
      } catch (error) {
        if (!swallowErrors) throw error

        console.log(error)
        result = null
      }

      output.push(result)
    }

    return isArray ? output : output[0]
  }

  protected async getSignaturesChunk({
    account,
    before,
    until,
    limit,
  }: EthereumSignaturesChunkOptions): Promise<EthereumSignaturesChunkResponse> {
    if (!this.accountSignatureDAL)
      throw new Error(
        'EthereumAccountTransactionHistoryStorage not provided to EthereumClient',
      )

    if (before <= 0 || until >= before)
      throw new Error('Invalid signature chunk range')

    before = before - 1
    until = until + 1

    const chunk: EthereumSignature[] = []

    const signatures = await this.accountSignatureDAL
      .useIndex(EthereumAccountTransactionHistoryDALIndex.AccountHeightIndex)
      .getAllValuesFromTo([account, until], [account, before], {
        limit,
        atomic: true,
      })

    for await (const sig of signatures) chunk.push(sig)

    const count = chunk.length
    const firstItem = chunk[0]
    const lastItem = chunk[chunk.length - 1]

    if (chunk.length > 0)
      console.log(
        'signature chunk => ',
        count,
        firstItem.height,
        lastItem.height,
      )

    return {
      chunk,
      count,
      firstItem,
      lastItem,
    }
  }

  protected async getLogsChunk({
    account,
    before,
    until,
    limit,
    isContractAccount,
  }: EthereumLogsChunkOptions): Promise<EthereumLogsChunkResponse> {
    if (!this.logBloomDAL)
      throw new Error('EthereumLogBloomStorage not provided to EthereumClient')

    if (before <= 0 || until >= before)
      throw new Error('Invalid log chunk range')

    before = before - 1
    until = until + 1

    const chunk: EthereumLogBloom[] = []

    const logBlooms = await this.logBloomDAL
      .useIndex(EthereumLogBloomDALIndex.Timestamp)
      .getAllValuesFromTo([until], [before], {
        limit,
        atomic: true,
      })

    for await (const bloom of logBlooms) chunk.push(bloom)

    const count = chunk.length
    const firstItem = chunk[0]
    const lastItem = chunk[chunk.length - 1]

    if (chunk.length > 0)
      console.log('logs chunk => ', count, firstItem.height, lastItem.height)

    const checkFn = isContractAccount
      ? isContractAddressInBloom
      : isUserEthereumAddressInBloom

    const filteredChunk = chunk.filter(({ logsBloom }) =>
      checkFn(logsBloom, account),
    )

    if (filteredChunk.length > 0)
      console.log('filtered logs chunk => ', filteredChunk.length)

    const blocksHeights = filteredChunk.map((item) => item.height)
    const logs = (await this.getLogs(
      blocksHeights,
      isContractAccount ? account : undefined,
    )) as EthereumRawLog[]

    console.log('logs', logs)

    let filteredLogs = logs

    if (!isContractAccount) {
      const accountHash = this.keccak256(account)
      console.log('accountHash', accountHash)
      filteredLogs = logs.filter((log) => log.topics.includes(accountHash))
    }

    return {
      chunk: filteredLogs,
      count,
      firstItem,
      lastItem,
    }
  }

  protected async completeTransactionsWithBlockInfo(
    tx: Transaction | null,
  ): Promise<EthereumRawTransaction | null> {
    if (!tx) return tx

    const newTx = tx as EthereumRawTransaction
    newTx.id = tx.hash
    newTx.signature = tx.hash

    let timestamp: number | undefined

    if (this.accountSignatureDAL) {
      const sigInfo = await this.accountSignatureDAL.get([newTx.signature])
      timestamp = sigInfo?.timestamp
    }

    if (timestamp === undefined && newTx.blockNumber) {
      const [block] = await this.getBlocks([newTx.blockNumber], false)
      timestamp = Number(block.timestamp)
    }

    if (!timestamp) return null
    newTx.timestamp = timestamp

    return newTx
  }

  protected async completeLogsWithBlockInfo(
    log: Log,
    logsBloom?: EthereumLogBloom,
  ): Promise<EthereumRawLog | null> {
    if (!log) return log

    const newLog = log as EthereumRawLog
    newLog.height = log.blockNumber
    newLog.id = `${newLog.height}_${newLog.logIndex}`

    let timestamp: number | undefined

    if (logsBloom) {
      timestamp = logsBloom.timestamp
    }

    if (timestamp === undefined && this.logBloomDAL) {
      const logsBloomInfo = await this.logBloomDAL.get([newLog.height])
      timestamp = logsBloomInfo?.timestamp
    }

    if (timestamp === undefined && newLog.blockNumber) {
      const [block] = await this.getBlocks([newLog.blockNumber], false)
      timestamp = Number(block.timestamp)
    }

    if (!timestamp) return null
    newLog.timestamp = timestamp

    return newLog
  }

  protected keccak256(data: string): string {
    return new Keccak(256).update(data).digest('hex')
  }
}
