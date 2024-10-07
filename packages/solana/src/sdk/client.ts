import {
  PublicKey,
  TransactionSignature,
  Supply,
  RpcResponseAndContext,
  SignaturesForAddressOptions,
  SolanaJSONRPCError,
  ConfirmedSignatureInfo,
} from '@solana/web3.js'
import { assert } from 'superstruct'
import { config } from '@aleph-indexer/core'
import { Connection } from './connection.js'
import {
  AlephParsedTransaction,
  RawParsedTransactionWithMeta,
  SolanaRawTransaction,
  VoteAccountInfo,
} from '../types.js'
import {
  SolanaSignatureInfo,
  SolanaTransactionHistoryPaginationResponse,
} from '../services/fetcher/src/types.js'
import {
  GetParsedTransactionRpcResult,
  GetSignaturesForAddressRpcResult,
  GetSupplyRpcResult,
  GetVoteAccounts,
} from './schema.js'
import { SolanaAccountTransactionHistoryStorage } from '../services/fetcher/src/dal/accountTransactionHistory.js'

export interface SolanaPaginationKey {
  signature: string
  slot: number
  timestamp: number
}

export interface SolanaRPCOptions {
  url: string
  rateLimit?: boolean
}

export interface SolanaTxL1Cache {
  getBySignature(signature: string): Promise<AlephParsedTransaction | undefined>
}

export type SolanaFetchSignaturesOptions = {
  address: string
  before?: string
  until?: string
  iterationLimit?: number
  errorFetching?: SolanaErrorFetching
  signatureBlacklist?: Set<string>
  untilSlot?: number
}

export type SolanaOptimizedHistoryOptions = {
  minSignatures: number
  addressPubkey: PublicKey
  errorFetching: SolanaErrorFetching
  limit?: number
  before?: string
  until?: string
  signatureBlacklist?: Set<string>
  untilSlot?: number
}

export type SolanaOptimizedHistoryResponse = {
  chunk: SolanaSignatureInfo[]
  firstItem?: SolanaSignatureInfo
  lastItem?: SolanaSignatureInfo
  count: number
}

export enum SolanaErrorFetching {
  SkipErrors = -1,
  OnlyErrors = 1,
}

export class SolanaRPC {
  protected connection: Connection
  protected rateLimit = false
  protected genesisBlockTimestamp = 1584368940000 // 2020-03-16T14:29:00.000Z
  protected firstBlockWithTimestamp = 39824214 // blockTime is 1602083250 (2020-10-07T15:07:30.000Z)

  constructor(
    protected options: SolanaRPCOptions,
    protected accountSignatureDAL?: SolanaAccountTransactionHistoryStorage,
  ) {
    this.connection = new Connection(options.url, {
      rateLimit: options.rateLimit,
    })
    this.rateLimit = options.rateLimit || false
  }

  getConnection(): Connection {
    return this.connection
  }

  async getVoteAccount(votePubkey: string): Promise<VoteAccountInfo> {
    const unsafeRes = await this.connection._rpcRequest('getVoteAccounts', [
      {
        commitment: 'finalized',
        keepUnstakedDelinquents: true,
        votePubkey,
      },
    ])

    const res = unsafeRes.result

    if ('error' in unsafeRes) {
      throw new SolanaJSONRPCError(
        res.error.message,
        'failed to get vote accounts: ',
      )
    }

    if (config.STRICT_CHECK_RPC) {
      assert(res, GetVoteAccounts)
    }

    const data = res.current?.[0] || res.delinquent?.[0]
    data.delinquent = res.delinquent.length > 0

    return data
  }

  async getSupply(): Promise<
    RpcResponseAndContext<Omit<Supply, 'nonCirculatingAccounts'>>
  > {
    const unsafeRes = await this.connection._rpcRequest('getSupply', [
      {
        commitment: 'finalized',
        excludeNonCirculatingAccountsList: true,
      },
    ])

    if ('error' in unsafeRes) {
      throw new SolanaJSONRPCError(unsafeRes.error, 'failed to get supply:')
    }

    const res = unsafeRes.result

    if (config.STRICT_CHECK_RPC) {
      assert(res, GetSupplyRpcResult)
    }

    return res
  }

  async getSignaturesForAddress(
    address: PublicKey,
    options?: SignaturesForAddressOptions,
  ): Promise<SolanaSignatureInfo[]> {
    const batch: any[] = [
      { methodName: 'getSlot' },
      {
        methodName: 'getSignaturesForAddress',
        args: [
          address.toBase58(),
          {
            commitment: 'finalized',
            encoding: 'jsonParsed',
            maxSupportedTransactionVersion: 0,
            ...options,
          },
        ],
      },
    ]

    const [, unsafeRes] = await this.connection._rpcBatchRequest(batch)

    if ('error' in unsafeRes) {
      throw new SolanaJSONRPCError(
        unsafeRes.error,
        'failed to get signatures for address',
      )
    }

    const res = unsafeRes.result

    if (config.STRICT_CHECK_RPC) {
      assert(res, GetSignaturesForAddressRpcResult)
    }

    return res
  }

  async getConfirmedTransaction(
    signature: string,
  ): Promise<SolanaRawTransaction | null> {
    const [result] = await this.getConfirmedTransactions([signature])
    return result
  }

  async getConfirmedTransactions(
    signatures: string[],
    options?: { swallowErrors?: boolean },
  ): Promise<(SolanaRawTransaction | null)[]> {
    let batch: any[] = signatures.map((signature) => {
      return {
        methodName: 'getTransaction',
        args: [
          signature,
          {
            commitment: 'finalized',
            encoding: 'jsonParsed',
            maxSupportedTransactionVersion: 0,
          },
        ],
      }
    })

    // @note: getTransaction failse with 429 without adding this
    batch = [{ methodName: 'getBlockHeight' }].concat(batch)

    const unsafeRes = await this.connection._rpcBatchRequest(batch)

    // @note: Drop the response of getBlockHeight
    unsafeRes.shift()

    const txs: SolanaRawTransaction[] = unsafeRes.map(
      ({
        error,
        result,
      }: {
        error: any
        result: RawParsedTransactionWithMeta
      }): SolanaRawTransaction | null => {
        if (error) {
          const message = `failed to get confirmed transactions: ${error.message}`

          if (options?.swallowErrors) {
            console.log(message)
            return null
          }

          throw new SolanaJSONRPCError(error, message)
        }

        if (config.STRICT_CHECK_RPC) {
          assert(result, GetParsedTransactionRpcResult)
        }

        if (result === null) return result

        const outputResult = result as SolanaRawTransaction

        return outputResult
      },
    )

    return Promise.all(
      txs.map((tx) =>
        this.completeTransactionsInfo(tx, options?.swallowErrors),
      ),
    )
  }

  async *fetchTransactionHistory({
    address,
    before,
    until,
    untilSlot,
    iterationLimit: maxLimit = 1000,
    errorFetching = SolanaErrorFetching.SkipErrors,
    signatureBlacklist,
  }: SolanaFetchSignaturesOptions): AsyncGenerator<SolanaTransactionHistoryPaginationResponse> {
    const addressPubkey = new PublicKey(address)
    let firstKey
    let lastKey

    while (maxLimit > 0) {
      const limit = Math.min(maxLimit, 1000)
      maxLimit = maxLimit - limit

      console.log(`
        solana fetch signatures [${address}] { 
          address: ${address}
          before: ${before}
          until: ${until}
          maxLimit: ${maxLimit}
        }
      `)

      const { chunk, count, firstItem, lastItem } =
        await this.getOptimizedHistory({
          minSignatures: 1000,
          addressPubkey,
          limit,
          before,
          until,
          untilSlot,
          errorFetching,
          signatureBlacklist,
        })

      if (!lastKey && lastItem) {
        lastKey = {
          signature: lastItem.signature,
          slot: lastItem.slot,
          timestamp: lastItem.timestamp,
        }
      }

      if (firstItem) {
        firstKey = {
          signature: firstItem.signature,
          slot: firstItem.slot,
          timestamp: firstItem.timestamp,
        }
      }

      if (count === 0) break

      yield { chunk, count, cursors: { backward: firstKey, forward: lastKey } }

      if (count < limit) break

      before = firstKey?.signature
    }
  }

  protected async getOptimizedHistory({
    minSignatures,
    addressPubkey,
    errorFetching,
    limit,
    before,
    until,
    untilSlot,
    signatureBlacklist,
  }: SolanaOptimizedHistoryOptions): Promise<SolanaOptimizedHistoryResponse> {
    let chunk: SolanaOptimizedHistoryResponse['chunk'] = []
    let count = 0
    let firstItem
    let lastItem

    let history: SolanaSignatureInfo[]
    let retries = 1

    // @note: Ensure that there will be at least "minSignatures" valid signatures to be fetched for not wasting batch
    // fetching size performing getConfirmedTransaction requests with just a few txs
    do {
      const sigs = await this.connection.getSignaturesForAddress(
        addressPubkey,
        {
          limit,
          before,
          // @note: We are getting different responses with and without including "until" query arg
          // that in some cases is causing infinite loops, so we need to handle it locally
          // until,
        },
      )

      // @note: Calculate estimated timestamps, ids, etc
      history = sigs.map((sig) => this.completeTransactionSignaturesInfo(sig))

      // @note: workaround for https://github.com/solana-labs/solana/issues/24620
      // @note: being handled on the next lines due to other unrelated issue with infinite loops
      // if (!before && until && untilSlot) {
      //   history = history.filter((item) => item.slot >= untilSlot)
      // }

      let untilFound = false
      const filteredUntil = []

      if (until !== undefined) {
        for (const item of history) {
          // @note: We are assuming that the history is sorted in DESC order of slot
          if (untilFound) break
          if (untilSlot && item.slot < untilSlot) continue

          untilFound = until === item.signature

          if (!untilFound) {
            filteredUntil.push(item)
          }
        }

        history = filteredUntil
      }

      // @note: Some private RPC clusters (genesysgo) have a load balancer in front of
      // some problematic nodes that are returning wrong empty responses, after some retries we get the right response
      retries--

      // console.log('history.length', history.length)
      if (history.length === 0) continue

      if (!lastItem) lastItem = history[0]
      firstItem = history[history.length - 1]
      count += history.length
      before = firstItem.signature

      const filteredHistory = history.filter((item: any) =>
        this.filterSignature(item, errorFetching, signatureBlacklist),
      )

      chunk = chunk.concat(filteredHistory)
    } while (
      chunk.length < minSignatures &&
      (history.length > 0 || (!this.rateLimit && before && retries > 0))
    )

    return {
      chunk,
      count,
      firstItem,
      lastItem,
    }
  }

  protected filterSignature(
    item: SolanaSignatureInfo,
    errorFetching?: SolanaErrorFetching,
    signatureBlacklist?: Set<string>,
  ): TransactionSignature | undefined {
    if (errorFetching) {
      if (errorFetching === SolanaErrorFetching.SkipErrors && item.err) {
        return
      } else if (
        errorFetching === SolanaErrorFetching.OnlyErrors &&
        !item.err
      ) {
        return
      }
    }

    if (signatureBlacklist && signatureBlacklist.has(item.signature)) {
      return
    }

    return item.signature
  }

  protected completeTransactionSignaturesInfo(
    sig: ConfirmedSignatureInfo,
  ): SolanaSignatureInfo {
    const newSig = sig as unknown as SolanaSignatureInfo

    newSig.id = sig.signature
    newSig.signature = newSig.id
    delete (newSig as any).memo
    delete (newSig as any).confirmationStatus
    newSig.timestamp = this.calculateBlockTimestamp(
      newSig.slot,
      newSig.blockTime,
    )

    return newSig
  }

  protected async completeTransactionsInfo<
    S extends boolean,
    R = S extends false ? SolanaRawTransaction : SolanaRawTransaction | null,
  >(tx: RawParsedTransactionWithMeta | null, swallowErrors?: S): Promise<R> {
    if (!tx) {
      if (!swallowErrors) throw new Error('Invalid null tx')
      return tx as R
    }

    const newTx = tx as SolanaRawTransaction

    newTx.id = tx.transaction.signatures[0]
    newTx.signature = newTx.id

    let timestamp: number | undefined

    if (this.accountSignatureDAL) {
      const sigInfo = await this.accountSignatureDAL.get([newTx.signature])
      timestamp = sigInfo?.timestamp
    }

    if (!timestamp) {
      timestamp = this.calculateBlockTimestamp(newTx.slot, newTx.blockTime)
    }

    newTx.timestamp = timestamp

    return newTx as R
  }

  protected calculateBlockTimestamp(
    slot: number,
    blockTime?: number | null,
  ): number {
    let timestamp: number | undefined = blockTime ? blockTime * 1000 : undefined

    if (timestamp === undefined) {
      // && slot < this.firstBlockWithTimestamp
      timestamp = this.getAproximatedTimestamp(slot)
    }

    return timestamp
  }

  // @note: Genesis block has blockTime === 1584368940 which is wrong
  // Replace it with genesisBlockTimestamp to don't cause problems querying entities by time range
  // @note: Also before block 39824214 the blockTime is 0 so aproximate it taking into account there is
  // a new slot each 400ms
  protected getAproximatedTimestamp(slot: number): number {
    return this.genesisBlockTimestamp + slot * 400
  }
}

export class SolanaRPCRoundRobin {
  protected i = 0
  protected rpcClients: SolanaRPC[] = []

  constructor(
    rpcs: (string | SolanaRPC)[],
    rateLimit = false,
    accountSignatureDAL: SolanaAccountTransactionHistoryStorage,
  ) {
    const dedup = rpcs
      .filter((rpc) => !!rpc)
      .map((rpc) => {
        return rpc instanceof SolanaRPC
          ? rpc
          : new SolanaRPC({ url: rpc, rateLimit }, accountSignatureDAL)
      })
      .reduce((acc, curr) => {
        const url = curr.getConnection().endpoint
        acc[url] = curr
        return acc
      }, {} as Record<string, SolanaRPC>)

    this.rpcClients = Object.values(dedup)
  }

  getClient(): SolanaRPC {
    const rpc = this.rpcClients[this.i]
    this.i = (this.i + 1) % this.rpcClients.length
    return rpc
  }

  getAllClients(): SolanaRPC[] {
    return this.rpcClients
  }

  getProxy(): SolanaRPC {
    return new Proxy(this, {
      get(target, prop: keyof SolanaRPC) {
        const client = target.getClient()
        return client[prop]
      },
    }) as unknown as SolanaRPC
  }
}
