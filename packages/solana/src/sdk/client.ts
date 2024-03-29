import {
  PublicKey,
  ConfirmedSignatureInfo,
  TransactionSignature,
  Supply,
  RpcResponseAndContext,
  SignaturesForAddressOptions,
  SolanaJSONRPCError,
} from '@solana/web3.js'
import {
  type as pick,
  number,
  string,
  array,
  boolean,
  literal,
  union,
  optional,
  nullable,
  coerce,
  unknown,
  tuple,
  assert,
} from 'superstruct'
import { config } from '@aleph-indexer/core'
import { Connection } from './connection.js'
import {
  AlephParsedTransaction,
  RawParsedTransactionWithMeta,
  SolanaRawTransaction,
  VoteAccountInfo,
} from '../types.js'
import { SolanaTransactionHistoryPaginationResponse } from '../services/fetcher/src/types.js'

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
  chunk: (AlephParsedTransaction | ConfirmedSignatureInfo)[]
  firstItem?: ConfirmedSignatureInfo
  lastItem?: ConfirmedSignatureInfo
  count: number
}

export enum SolanaErrorFetching {
  SkipErrors = -1,
  OnlyErrors = 1,
}

export class SolanaRPC {
  protected connection: Connection
  protected rateLimit = false

  constructor(options: SolanaRPCOptions) {
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
  ): Promise<ConfirmedSignatureInfo[]> {
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
    const unsafeRes = await this.connection._rpcRequest('getTransaction', [
      signature,
      {
        commitment: 'finalized',
        encoding: 'jsonParsed',
        maxSupportedTransactionVersion: 0,
      },
    ])

    if ('error' in unsafeRes) {
      throw new SolanaJSONRPCError(unsafeRes.error, 'failed to get transaction')
    }

    const res = unsafeRes.result

    if (config.STRICT_CHECK_RPC) {
      assert(res, GetParsedTransactionRpcResult)
    }

    return res
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

    const out = unsafeRes.map(
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
        outputResult.id = result.transaction.signatures[0]

        return outputResult
      },
    )

    return out
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
          timestamp: (lastItem.blockTime || 0) * 1000,
        }
      }

      if (firstItem) {
        firstKey = {
          signature: firstItem.signature,
          slot: firstItem.slot,
          timestamp: (firstItem.blockTime || 0) * 1000,
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

    let history
    let retries = 7

    // @note: Ensure that there will be at least "minSignatures" valid signatures to be fetched for not wasting batch
    // fetching size performing getConfirmedTransaction requests with just a few txs
    do {
      history = await this.connection.getSignaturesForAddress(addressPubkey, {
        limit,
        before,
        // @note: We are getting different responses with and without including "until" query arg
        // that in some cases is causing infinite loops, so we need to handle it locally
        // until,
      })

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
    item: ConfirmedSignatureInfo,
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
}

export class SolanaRPCRoundRobin {
  protected i = 0
  protected rpcClients: SolanaRPC[] = []

  constructor(rpcs: (string | SolanaRPC)[], rateLimit = false) {
    const dedup = rpcs
      .filter((rpc) => !!rpc)
      .map((rpc) => {
        return rpc instanceof SolanaRPC
          ? rpc
          : new SolanaRPC({
              url: rpc,
              rateLimit,
            })
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

const AddressTableLookupStruct = pick({
  accountKey: string(),
  writableIndexes: array(number()),
  readonlyIndexes: array(number()),
})

const LoadedAddressesResult = pick({
  writable: array(string()),
  readonly: array(string()),
})

const TokenAmountResult = pick({
  amount: string(),
  uiAmount: nullable(number()),
  decimals: number(),
  uiAmountString: optional(string()),
})

const TokenBalanceResult = pick({
  accountIndex: number(),
  mint: string(),
  owner: optional(string()),
  uiTokenAmount: TokenAmountResult,
})

const TransactionErrorResult = nullable(union([pick({}), string()]))

const RawInstructionResult = pick({
  accounts: array(string()),
  data: string(),
  programId: string(),
})

const ParsedInstructionResult = pick({
  parsed: unknown(),
  program: string(),
  programId: string(),
})

const InstructionResult = union([RawInstructionResult, ParsedInstructionResult])

const UnknownInstructionResult = union([
  pick({
    parsed: unknown(),
    program: string(),
    programId: string(),
  }),
  pick({
    accounts: array(string()),
    data: string(),
    programId: string(),
  }),
])

const ParsedOrRawInstruction = coerce(
  InstructionResult,
  UnknownInstructionResult,
  (value) => {
    if ('accounts' in value) {
      RawInstructionResult
    } else {
      ParsedInstructionResult
    }
  },
)

const ParsedConfirmedTransactionResult = pick({
  signatures: array(string()),
  message: pick({
    accountKeys: array(
      pick({
        pubkey: string(),
        signer: boolean(),
        writable: boolean(),
        source: optional(
          union([literal('transaction'), literal('lookupTable')]),
        ),
      }),
    ),
    instructions: array(ParsedOrRawInstruction),
    recentBlockhash: string(),
    addressTableLookups: optional(nullable(array(AddressTableLookupStruct))),
  }),
})

const TransactionVersionStruct = union([literal(0), literal('legacy')])

const ParsedConfirmedTransactionMetaResult = pick({
  err: TransactionErrorResult,
  fee: number(),
  innerInstructions: optional(
    nullable(
      array(
        pick({
          index: number(),
          instructions: array(ParsedOrRawInstruction),
        }),
      ),
    ),
  ),
  preBalances: array(number()),
  postBalances: array(number()),
  logMessages: optional(nullable(array(string()))),
  preTokenBalances: optional(nullable(array(TokenBalanceResult))),
  postTokenBalances: optional(nullable(array(TokenBalanceResult))),
  loadedAddresses: optional(LoadedAddressesResult),
  computeUnitsConsumed: optional(number()),
})

/**
 * Expected JSON RPC response for the "getTransaction" message
 */
const GetParsedTransactionRpcResult = nullable(
  pick({
    slot: number(),
    transaction: ParsedConfirmedTransactionResult,
    meta: nullable(ParsedConfirmedTransactionMetaResult),
    blockTime: optional(nullable(number())),
    version: optional(TransactionVersionStruct),
  }),
)

const VoteAccountInfoResult = pick({
  votePubkey: string(),
  nodePubkey: string(),
  activatedStake: number(),
  epochVoteAccount: boolean(),
  epochCredits: array(tuple([number(), number(), number()])),
  commission: number(),
  lastVote: number(),
  rootSlot: nullable(number()),
})

/**
 * Expected JSON RPC response for the "getVoteAccounts" message
 */
const GetVoteAccounts = pick({
  current: array(VoteAccountInfoResult),
  delinquent: array(VoteAccountInfoResult),
})

const SupplyContext = pick({
  apiVersion: string(),
  slot: number(),
})

const SupplyValue = pick({
  total: number(),
  circulating: number(),
  nonCirculating: number(),
  nonCirculatingAccounts: array(string()),
})

/**
 * Expected JSON RPC response for the "getSupply" message
 */
const GetSupplyRpcResult = pick({
  context: SupplyContext,
  value: SupplyValue,
})

/**
 * Expected JSON RPC response for the "getSignaturesForAddress" message
 */
const GetSignaturesForAddressRpcResult = array(
  pick({
    signature: string(),
    slot: number(),
    err: TransactionErrorResult,
    memo: nullable(string()),
    blockTime: optional(nullable(number())),
  }),
)
