import { promisify } from 'node:util'
import ethers from 'ethers'
import Web3 from 'web3'
import { Block, Transaction, Eth } from 'web3-eth'
import { errors } from 'web3-core-helpers'
import { Log, PastLogsOptions } from 'web3-core'
import {
  isUserEthereumAddressInBloom,
  isContractAddressInBloom,
} from 'ethereum-bloom-filters'
import {
  EthereumRawBlock,
  EthereumRawLog,
  EthereumLogBloom,
  EthereumRawTransaction,
  EthereumAccountTransactionHistoryStorageEntity,
} from '../types.js'
import {
  EthereumParsedLog,
  EthereumParsedTransaction,
} from '../services/parser/src/types.js'
import {
  EthereumBlockPaginationResponse,
  EthereumFetchBlocksOptions,
  EthereumFetchLogsOptions,
  EthereumFetchSignaturesOptions,
  EthereumLogHistoryPaginationResponse,
  EthereumTransactionHistoryPaginationResponse,
} from '../services/fetcher/src/types.js'
import {
  EthereumAccountTransactionHistoryDALIndex,
  EthereumAccountTransactionHistoryStorage,
} from '../services/fetcher/src/transaction/dal/accountTransactionHistory.js'
import { EthereumLogBloomStorage } from '../services/fetcher/src/log/dal/logBloom.js'

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
  chunk: EthereumRawBlock[]
  firstItem?: EthereumRawBlock
  lastItem?: EthereumRawBlock
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
  chunk: EthereumAccountTransactionHistoryStorageEntity[]
  firstItem?: EthereumAccountTransactionHistoryStorageEntity
  lastItem?: EthereumAccountTransactionHistoryStorageEntity
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
      txs.map((tx) =>
        this.completeTransactionsWithBlockInfo(tx, options?.swallowErrors),
      ),
    )
  }

  async getLogs(
    ids: string[],
    options?: { swallowErrors: boolean },
  ): Promise<(EthereumRawLog | null)[]> {
    const results: Record<string, null | EthereumRawLog> = {}

    const blockHeightLogs = ids.reduce((blockMap, id) => {
      // log.id = `${log.height}_${log.address}_${log.logIndex}`
      const parts = id.split('_')
      const height = Number(parts[0])
      const address = parts[1]
      const logIndex = Number(parts[2])

      const contractMap = (blockMap[height] = blockMap[height] || {})
      const logSet = (contractMap[address] = contractMap[address] || new Set())

      logSet.add(logIndex)
      results[id] = null

      return blockMap
    }, {} as Record<number, Record<string, Set<number>>>)

    for (const [height, contractMap] of Object.entries(blockHeightLogs)) {
      for (const [address, logSet] of Object.entries(contractMap)) {
        const logs = await this.getBlockLogs(
          [height],
          options?.swallowErrors,
          address,
        )

        for (const log of logs) {
          if (!log) continue
          const logIndex = log.logIndex

          if (!logSet.has(logIndex)) continue

          results[log.id] = log
        }
      }
    }

    const response = ids.map((id) => results[id])
    return response
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
    const parsedTx = { ...rawTx, parsed: null } as EthereumParsedTransaction
    if (!abi) return parsedTx

    const iface = new ethers.utils.Interface(abi)
    parsedTx.parsed = iface.parseTransaction({
      data: rawTx.input,
      value: rawTx.value,
    })

    return parsedTx
  }

  parseLog(rawLog: EthereumRawLog, abi?: any): EthereumParsedLog {
    const parsedLog = { ...rawLog, parsed: null } as EthereumParsedLog
    if (!abi) return parsedLog

    const iface = new ethers.utils.Interface(abi)
    parsedLog.parsed = iface.parseLog(rawLog)

    return parsedLog
  }

  async *fetchBlockHistory(
    args: EthereumFetchBlocksOptions,
  ): AsyncGenerator<EthereumBlockPaginationResponse> {
    let firstKey
    let lastKey

    const { until = -1, pageLimit = 1000 } = args

    let {
      before = (await this.sdk.eth.getBlockNumber()) + 1,
      iterationLimit = 1000,
    } = args

    while (iterationLimit > 0) {
      const limit = Math.min(iterationLimit, pageLimit)
      iterationLimit = iterationLimit - limit

      console.log(`
        ethereum fetch blocks { 
          before: ${before}
          until: ${until}
          iterationLimit: ${iterationLimit}
        }
      `)

      const { chunk, count, firstItem, lastItem } =
        await this.getBlockHistoryChunk({
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

      yield { chunk, count, cursors: { backward: firstKey, forward: lastKey } }

      if (count < limit) break

      before = firstKey?.height as number
    }
  }

  async *fetchTransactionHistory(
    args: EthereumFetchSignaturesOptions,
  ): AsyncGenerator<EthereumTransactionHistoryPaginationResponse> {
    let firstKey
    let lastKey

    const { account, until = -1, pageLimit = 1000 } = args

    let {
      before = (await this.sdk.eth.getBlockNumber()) + 1,
      iterationLimit = 1000,
    } = args

    while (iterationLimit > 0) {
      const limit = Math.min(iterationLimit, pageLimit)
      iterationLimit = iterationLimit - limit

      console.log(`
        ethereum fetch signatures { 
          account: ${account}
          before: ${before}
          until: ${until}
          iterationLimit: ${iterationLimit}
        }
      `)

      const { chunk, count, firstItem, lastItem } =
        await this.getTransactionHistoryChunk({
          account,
          limit,
          before,
          until,
        })

      if (count === 0) break

      if (!lastKey && lastItem) {
        lastKey = {
          height: lastItem.height,
          timestamp: lastItem.timestamp,
          signature: lastItem.id,
        }
      }

      if (firstItem) {
        firstKey = {
          height: firstItem.height,
          timestamp: firstItem.timestamp,
          signature: firstItem.id,
        }
      }

      yield { chunk, count, cursors: { backward: firstKey, forward: lastKey } }

      if (count < limit) break

      before = firstKey?.height as number
    }
  }

  async *fetchLogHistory(
    args: EthereumFetchLogsOptions,
  ): AsyncGenerator<EthereumLogHistoryPaginationResponse> {
    let firstKey
    let lastKey

    // @note: pageLimit = 10 to avoid Error: Too many ["eth_getLogs"] methods in the batch
    const { account, until = -1, pageLimit = 10, isContractAccount } = args

    let {
      before = (await this.sdk.eth.getBlockNumber()) + 1,
      iterationLimit = 1000,
    } = args

    while (iterationLimit > 0) {
      const limit = Math.min(iterationLimit, pageLimit)
      iterationLimit = iterationLimit - limit

      console.log(`
        ethereum fetch logs { 
          account: ${account}
          before: ${before}
          until: ${until}
          iterationLimit: ${iterationLimit}
        }
      `)

      const { chunk, count, firstItem, lastItem } =
        await this.getLogHistoryChunk({
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
          timestamp: lastItem.timestamp,
        }
      }

      if (firstItem) {
        firstKey = {
          height: firstItem.height,
          timestamp: firstItem.timestamp,
        }
      }

      yield { chunk, count, cursors: { backward: firstKey, forward: lastKey } }

      if (count < limit) break

      before = firstKey?.height as number
    }
  }

  async indexBlockSignatures(blocks: EthereumRawBlock[]): Promise<void> {
    if (!this.accountSignatureDAL)
      throw new Error(
        'EthereumAccountTransactionHistoryStorage not provided to EthereumClient',
      )

    const signatures = blocks.flatMap((block) =>
      block.transactions.map((tx) => {
        const accounts = [tx.from]
        if (tx.to) accounts.push(tx.to)

        const sig: EthereumAccountTransactionHistoryStorageEntity = {
          id: tx.hash,
          height: block.number,
          timestamp: block.timestamp,
          index: tx.transactionIndex as number,
          accounts,
        }

        return sig
      }),
    )

    await this.accountSignatureDAL.save(signatures)
  }

  async indexBlockLogBloom(blocks: EthereumRawBlock[]): Promise<void> {
    if (!this.logBloomDAL)
      throw new Error('EthereumLogBloomStorage not provided to EthereumClient')

    const logBlooms = blocks.map((block) => {
      return {
        logsBloom: block.logsBloom,
        height: block.number,
        timestamp: block.timestamp,
      }
    })

    await this.logBloomDAL.save(logBlooms)
  }

  protected async getBlocks(
    blockHashOrBlockNumber: (number | string)[],
    returnTransactionObjects = true,
  ): Promise<EthereumRawBlock[]> {
    const args = blockHashOrBlockNumber.map((blockOrNum) => [
      blockOrNum,
      returnTransactionObjects,
    ])

    const blocks: EthereumRawBlock[] = await this.batchRequest(
      'getBlock',
      args,
      { swallowErrors: false },
    )

    return blocks.map((block) => this.completeBlocksInfo(block, false))
  }

  // @note: Check log id: https://github.com/web3/web3.js/blob/1.x/packages/web3-core-helpers/src/formatters.js#L399
  // var shaId = utils.sha3(log.blockHash.replace('0x', '') + log.transactionHash.replace('0x', '') + log.logIndex.replace('0x', ''));
  // log.id = 'log_' + shaId.replace('0x', '').slice(0, 8);
  protected async getBlockLogs<
    S extends boolean,
    R = S extends false ? EthereumRawLog : EthereumRawLog | null,
  >(
    blockHashOrBlockNumber: (number | string)[],
    swallowErrors?: S,
    address?: string,
  ): Promise<R[]> {
    const args: PastLogsOptions[][] = blockHashOrBlockNumber.map(
      (blockOrNum) => [{ fromBlock: blockOrNum, toBlock: blockOrNum, address }],
    )

    const logs: Log[] = await this.batchRequest('getPastLogs', args, {
      swallowErrors,
    })

    return Promise.all(
      logs.map((log) =>
        this.completeLogsWithBlockInfo<S, R>(log, swallowErrors),
      ),
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
  >(method: keyof Eth, args: A[], options?: { swallowErrors?: S }): Promise<R> {
    const methodInstance = this.sdk.eth[method].method
    const payload = args.map((arg) => methodInstance.toPayload(arg))

    const sendBatch = promisify(
      methodInstance.requestManager.sendBatch.bind(
        methodInstance.requestManager,
      ),
    )

    const results = await sendBatch(payload)
    const items = this.processJsonRpcResult(results, options?.swallowErrors)
    const out = methodInstance.formatOutput(items)

    return out
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

      if (Array.isArray(result)) {
        output.push(...result)
      } else {
        output.push(result)
      }
    }

    return isArray ? output : output[0]
  }

  protected async getBlockHistoryChunk({
    before,
    until,
    limit,
  }: EthereumBlocksChunkOptions): Promise<EthereumBlocksChunkResponse> {
    const length = Math.min(limit, Math.max(before - (until + 1), 0))
    if (length === 0) throw new Error('Invalid block chunk range')

    const cursor = before - 1
    const now = Date.now() / 1000

    const heights = Array.from({ length }).map((_, i) => cursor - i)
    const chunk = (await this.getBlocks(heights, true)) as EthereumRawBlock[]

    const count = chunk.length
    const lastItem = chunk[0]
    const firstItem = chunk[chunk.length - 1]

    if (chunk.length > 0)
      console.log(
        'ethereum block chunk => ',
        chunk.length,
        firstItem.number,
        lastItem.number,
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

  protected async getTransactionHistoryChunk({
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

    const now = Date.now() / 1000
    const chunk: EthereumAccountTransactionHistoryStorageEntity[] = []

    const signatures = await this.accountSignatureDAL
      .useIndex(EthereumAccountTransactionHistoryDALIndex.AccountHeightIndex)
      .getAllValuesFromTo([account, until], [account, before], {
        limit,
        reverse: true,
        atomic: true,
      })

    for await (const sig of signatures) chunk.push(sig)

    const count = chunk.length
    const lastItem = chunk[0]
    const firstItem = chunk[chunk.length - 1]

    if (chunk.length > 0)
      console.log(
        'ethereum transaction chunk => ',
        count,
        firstItem.height,
        lastItem.height,
        `${Number(Date.now() / 1000 - now).toFixed(4)} secs`,
      )

    return {
      chunk,
      count,
      firstItem,
      lastItem,
    }
  }

  protected async getLogHistoryChunk({
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

    const now = Date.now() / 1000
    const logBloomChunk: EthereumLogBloom[] = []

    const logBlooms = await this.logBloomDAL.getAllValuesFromTo(
      [until],
      [before],
      { limit, reverse: true, atomic: true },
    )

    for await (const bloom of logBlooms) logBloomChunk.push(bloom)

    const count = logBloomChunk.length
    const lastItem = logBloomChunk[0]
    const firstItem = logBloomChunk[logBloomChunk.length - 1]
    let chunk: EthereumRawLog[] = []

    if (logBloomChunk.length > 0) {
      const checkFn = isContractAccount
        ? isContractAddressInBloom
        : isUserEthereumAddressInBloom

      const filteredLogBloomChunk = logBloomChunk.filter(({ logsBloom }) =>
        checkFn(logsBloom, account),
      )

      if (filteredLogBloomChunk.length > 0) {
        const blocksHeights = filteredLogBloomChunk.map((item) => item.height)

        const logs = (await this.getBlockLogs(
          blocksHeights,
          false,
          isContractAccount ? account : undefined,
        )) as EthereumRawLog[]

        let filteredLogs = logs

        if (!isContractAccount) {
          const accountTopic = `0x${account.substring(2).padStart(64, '0')}`
          filteredLogs = logs.filter((log) => log.topics.includes(accountTopic))
        }

        chunk = filteredLogs
      }
    }

    if (chunk.length > 0)
      console.log(
        'ethereum log chunk => ',
        chunk.length,
        firstItem.height,
        lastItem.height,
        `${Number(Date.now() / 1000 - now).toFixed(4)} secs`,
      )

    return {
      chunk,
      count,
      firstItem,
      lastItem,
    }
  }

  protected completeBlocksInfo<
    S extends boolean,
    R = S extends false ? EthereumRawBlock : EthereumRawBlock | null,
  >(block: Block | null, swallowErrors?: S): R {
    if (!block) {
      if (!swallowErrors) throw new Error('Invalid null block')
      return block as R
    }

    const newBlock = block as EthereumRawBlock
    newBlock.id = newBlock.hash
    newBlock.timestamp = Number(newBlock.timestamp) * 1000

    return newBlock as R
  }

  protected async completeTransactionsWithBlockInfo<
    S extends boolean,
    R = S extends false
      ? EthereumRawTransaction
      : EthereumRawTransaction | null,
  >(tx: Transaction | null, swallowErrors?: S): Promise<R> {
    if (!tx) {
      if (!swallowErrors) throw new Error('Invalid null tx')
      return tx as R
    }

    const newTx = tx as EthereumRawTransaction
    newTx.id = tx.hash
    newTx.signature = tx.hash

    let timestamp: number | undefined

    if (this.accountSignatureDAL) {
      const sigInfo = await this.accountSignatureDAL.get([newTx.signature])
      timestamp = sigInfo?.timestamp
    }

    if (timestamp === undefined && newTx.blockNumber) {
      let [block] = await this.getBlocks([newTx.blockNumber], false)
      block = this.completeBlocksInfo(block, swallowErrors)
      if (block) timestamp = block.timestamp
    }

    if (!timestamp) {
      if (!swallowErrors) throw new Error('Invalid tx timestamp')
      return null as R
    }

    newTx.timestamp = timestamp

    return newTx as R
  }

  protected async completeLogsWithBlockInfo<
    S extends boolean,
    R = S extends false ? EthereumRawLog : EthereumRawLog | null,
  >(log: Log | null, swallowErrors?: S): Promise<R> {
    if (!log) {
      if (!swallowErrors) throw new Error('Invalid null log')
      return log as R
    }

    const newLog = log as EthereumRawLog
    newLog.height = log.blockNumber
    newLog.id =
      `${newLog.height}_${newLog.address}_${newLog.logIndex}`.toLowerCase()

    let timestamp: number | undefined

    if (timestamp === undefined && this.logBloomDAL) {
      const logsBloomInfo = await this.logBloomDAL.get([newLog.height])

      timestamp = logsBloomInfo?.timestamp
    }

    if (timestamp === undefined && newLog.height) {
      let [block] = await this.getBlocks([newLog.height], false)

      block = this.completeBlocksInfo(block, swallowErrors)
      if (block) timestamp = block.timestamp
    }

    if (!timestamp) {
      if (!swallowErrors) throw new Error('Invalid log timestamp')
      return null as R
    }

    newLog.timestamp = timestamp

    return newLog as R
  }
}
