import {
  PublicKey,
  ConfirmedSignatureInfo,
  TransactionSignature,
  Supply,
  RpcResponseAndContext,
  SignaturesForAddressOptions,
  Finality,
  SolanaJSONRPCError,
} from '@solana/web3.js'
import { Parsers } from './parsers/common.js'
import { concurrentPromises } from './utils'
import { Connection } from './lib/solana/web3.js'
import {
  AlephParsedTransaction,
  RawTransaction,
  RawTransactionV1,
  TransactionParser,
  VoteAccountInfo,
} from './parsers/transaction.js'

export interface PaginationKey {
  signature: string
  slot: number
  timestamp: number
}
export interface SolanaRPCOptions {
  RPC_ENDPOINT: string
  PARSERS: Parsers
  rateLimit?: boolean
}

export interface SolanaTxL1Cache {
  getBySignature(signature: string): Promise<AlephParsedTransaction | undefined>
}

export type FetchSignaturesOptions = {
  address: string
  before?: string
  until?: string
  maxLimit?: number
  errorFetching?: ErrorFetching
  signatureBlacklist?: Set<string>
  untilSlot?: number
}

export type FetchDataOptions = {
  address: string
  before?: string
  until?: string
  maxLimit?: number
  errorFetching?: ErrorFetching
  signatureBlacklist?: Set<string>
  txsPerRequest?: number
  concurrentTxRequests?: number
  txCache?: SolanaTxL1Cache
  untilSlot?: number
}

export type HistoryChunkOptions = {
  addressPubkey: PublicKey
  errorFetching: ErrorFetching
  txsPerRequest: number
  concurrentTxRequests: number
  limit?: number
  before?: string
  until?: string
  signatureBlacklist?: Set<string>
  txCache?: SolanaTxL1Cache
}

export type OptimizedHistoryOptions = {
  minSignatures: number
  addressPubkey: PublicKey
  errorFetching: ErrorFetching
  limit?: number
  before?: string
  until?: string
  signatureBlacklist?: Set<string>
  untilSlot?: number
}

export type HistoryChunkResponse = {
  chunk: AlephParsedTransaction[]
  firstItem?: AlephParsedTransaction | ConfirmedSignatureInfo
  lastItem?: AlephParsedTransaction | ConfirmedSignatureInfo
  count: number
}

export type OptimizedHistoryResponse = {
  chunk: (AlephParsedTransaction | ConfirmedSignatureInfo)[]
  firstItem?: ConfirmedSignatureInfo
  lastItem?: ConfirmedSignatureInfo
  count: number
}

export enum ErrorFetching {
  SkipErrors = -1,
  OnlyErrors = 1,
}

export class SolanaRPC {
  protected connection: Connection
  protected parsers: Parsers = {}
  protected rateLimit = false

  constructor(options: SolanaRPCOptions) {
    this.connection = new Connection(options.RPC_ENDPOINT, {
      rateLimit: options.rateLimit,
    })
    this.parsers = options.PARSERS || this.parsers
    this.rateLimit = options.rateLimit || false
  }

  getConnection(): Connection {
    return this.connection
  }

  async getVoteAccount(votePubkey: string): Promise<VoteAccountInfo> {
    const res = await this.connection._rpcRequest('getVoteAccounts', [
      {
        commitment: 'finalized',
        keepUnstakedDelinquents: true,
        votePubkey,
      },
    ])

    if ('error' in res) {
      throw new Error('failed to get vote accounts: ' + res.error.message)
    }

    const data = res.result.current?.[0] || res.result.delinquent?.[0]
    data.delinquent = res.result.delinquent.length > 0

    return data
  }

  async getSupply(): Promise<
    RpcResponseAndContext<Omit<Supply, 'nonCirculatingAccounts'>>
  > {
    const res = await this.connection._rpcRequest('getSupply', [
      {
        commitment: 'finalized',
        excludeNonCirculatingAccountsList: true,
      },
    ])

    if ('error' in res) {
      throw new Error('failed to get supply: ' + res.error.message)
    }

    return res.result
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
            ...options,
          },
        ],
      },
    ]

    const [, res] = await this.connection._rpcBatchRequest(batch)

    if ('error' in res) {
      throw new SolanaJSONRPCError(
        res.error,
        'failed to get signatures for address',
      )
    }

    return res.result
  }

  async getConfirmedTransaction(
    signature: string,
  ): Promise<RawTransactionV1 | null> {
    const res = await this.connection._rpcRequest('getTransaction', [
      signature,
      {
        commitment: 'finalized',
        encoding: 'jsonParsed',
      },
    ])

    if ('error' in res) {
      throw new Error(
        'failed to get confirmed transaction: ' + res.error.message,
      )
    }

    return res.result
  }

  async getConfirmedTransactions(
    signatures: string[],
  ): Promise<(RawTransactionV1 | null)[]> {
    let batch: any[] = signatures.map((signature) => {
      return {
        methodName: 'getTransaction',
        args: [
          signature,
          {
            commitment: 'finalized',
            encoding: 'jsonParsed',
          },
        ],
      }
    })

    // @note: getTransaction failse with 429 without adding this
    batch = [{ methodName: 'getBlockHeight' }].concat(batch)

    const res = await this.connection._rpcBatchRequest(batch)

    // @note: Drop the response of getBlockHeight
    res.shift()

    return res.map(({ error, result }: any) => {
      if (error) {
        throw new Error(
          'failed to get confirmed transactions: ' + error.message,
        )
      }

      return result
    })
  }

  async *fetchSignatures({
    address,
    before,
    until,
    untilSlot,
    maxLimit = 1000,
    errorFetching = ErrorFetching.SkipErrors,
    signatureBlacklist,
  }: FetchSignaturesOptions): AsyncGenerator<{
    firstKey: undefined | PaginationKey
    lastKey: undefined | PaginationKey
    chunk: ConfirmedSignatureInfo[]
  }> {
    const addressPubkey = new PublicKey(address)
    let firstKey
    let lastKey

    while (maxLimit > 0) {
      const limit = Math.min(maxLimit, 1000)
      maxLimit = maxLimit - limit

      console.log(`
        fetch signatures [${address}] { 
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

      yield { chunk, firstKey, lastKey }

      if (count < limit) break

      before = firstKey?.signature
    }
  }

  async *fetchData({
    address,
    before,
    until,
    untilSlot,
    maxLimit = 1000,
    errorFetching = ErrorFetching.SkipErrors,
    signatureBlacklist,
    txsPerRequest = 100,
    concurrentTxRequests = 10,
    txCache,
  }: FetchDataOptions): AsyncGenerator<{
    firstKey: undefined | PaginationKey
    lastKey: undefined | PaginationKey
    chunk: AlephParsedTransaction[]
  }> {
    for await (const { chunk, firstKey, lastKey } of this.fetchSignatures({
      address,
      before,
      until,
      untilSlot,
      maxLimit,
      errorFetching,
      signatureBlacklist,
    })) {
      if (txCache) {
        const txs = await Promise.all(
          chunk.map(async ({ signature }) => txCache.getBySignature(signature)),
        )

        let countTxs = 0

        for (const [i, tx] of txs.entries()) {
          if (!tx) continue

          chunk[i] = tx
          countTxs++
        }

        console.log(
          `${countTxs}/${txs.length} txs taken from fetcher tx cache!`,
        )
      }

      const toBeFetched = chunk.filter((item) => !this.isTransaction(item))

      if (toBeFetched.length > 0) {
        const fetchedTxs = await this.fetchHistory(
          toBeFetched,
          txsPerRequest,
          concurrentTxRequests,
        )

        for (const [i, item] of chunk.entries()) {
          if (this.isTransaction(item)) continue
          chunk[i] = fetchedTxs.shift() as AlephParsedTransaction
        }
      }

      yield {
        chunk: chunk as AlephParsedTransaction[],
        firstKey,
        lastKey,
      }
    }
  }

  async *mergeFetchData(options: FetchDataOptions[]): AsyncGenerator<{
    firstKeys: Record<string, PaginationKey>
    lastKeys: Record<string, PaginationKey>
    chunk: AlephParsedTransaction[]
  }> {
    if (options.length < 2) throw new Error('Multiple options expected')

    const firstKeys: Record<string, PaginationKey> = {}
    const lastKeys: Record<string, PaginationKey> = {}

    // @note: In some cases we need to dedup txs (when some tx has been indexed by multipe fetch addresses because it contains different ixs)
    // For example if we use serum requestQueue address for fetching newOrderV3 ixs and vaultSigner address for fetching settleFunds ixs, there are
    // some txs that cotains both kind of ixs so we can dedup signatures before fetching txs for improving performance
    const signatureBlacklist = new Set<string>()

    const iterators = options.map((option) =>
      this.fetchData({ ...option, signatureBlacklist }),
    )

    const nextItems: {
      chunk: AlephParsedTransaction[]
      value: AlephParsedTransaction
    }[] = []
    let done = false

    while (!done) {
      const chunks = []

      // @note: Do secuentially for deduping signatures from previous chunks using the blacklist
      for (const it of iterators) {
        const chunk = await it.next()
        chunks.push(chunk)

        for (const tx of chunk.value?.chunk || []) {
          signatureBlacklist.add(tx.signature)
        }
      }

      const result: AlephParsedTransaction[] = []
      done = chunks.every((res) => res.done)

      for (const [index, val] of chunks.entries()) {
        const chunk: AlephParsedTransaction[] = val.value?.chunk || []

        if (chunk.length > 0) {
          const address = options[index].address

          if (!lastKeys[address]) {
            lastKeys[address] = val.value?.lastKey
          }

          firstKeys[address] = val.value?.firstKey
        }

        const value = chunk[0]
        if (value === undefined) continue

        nextItems.push({ chunk, value })
      }

      while (nextItems.length) {
        // @note: Sort from newest to oldest
        nextItems.sort((a, b) => b.value.slot - a.value.slot)

        const first = nextItems[0]
        const second = nextItems[1]

        while (
          first.value !== undefined &&
          (second?.value === undefined || first.value.slot >= second.value.slot)
        ) {
          result.push(first.value)
          first.chunk.shift()
          first.value = first.chunk[0]
        }

        if (first.value === undefined) {
          nextItems.splice(0, 1)
        }
      }

      if (result.length) {
        yield {
          chunk: result,
          firstKeys,
          lastKeys,
        }
      }
    }
  }

  /**
   * multi target fetching
   */
  async *multiFetchData(
    options: FetchDataOptions,
    targets: string[],
    context: any,
  ): AsyncGenerator<AlephParsedTransaction[]> {
    for await (const target of targets) {
      context.target = target // update context
      if (context.setOptions) await context.setOptions(options)
      options.address = target
      if (context.continue) continue

      const iterator = this.fetchData(options)
      for await (const { chunk: items } of iterator) {
        yield items
      }

      context.setOptions = null
      context.continue = false
    }
  }

  async getTransaction(
    signature: TransactionSignature,
    signatureInfo?: ConfirmedSignatureInfo,
  ): Promise<AlephParsedTransaction> {
    const result = await this.getConfirmedTransaction(signature)
    if (!result) throw new Error(`null transaction | ${signature}`)

    // console.log('signatureInfo', signatureInfo)
    // console.log('rawTx', JSON.stringify(result, null, 2))

    if (!signatureInfo) {
      const { blockTime, meta, slot } = result
      const err = meta ? meta.err : null

      signatureInfo = {
        signature,
        err,
        slot,
        blockTime,
        memo: null, // @todo: Think how to retrieve it
      }
    }

    const parsed = this.parseTransaction(signature, result, signatureInfo)

    // console.log('parsed', JSON.stringify(parsed, null, 2))

    return parsed
  }

  protected async getTransactionBulk(
    signaturesInfo: ConfirmedSignatureInfo[],
  ): Promise<AlephParsedTransaction[]> {
    if (signaturesInfo.length === 0) return []

    const signatures = signaturesInfo.map((info) => info.signature)
    const txs = await this.getConfirmedTransactions(signatures)

    return txs.map((tx, index) => {
      if (!tx) throw new Error(`null transaction | ${signatures[index]}`)
      const info = signaturesInfo[index]
      return this.parseTransaction(info.signature, tx, info)
    })
  }

  parseTransaction(
    signature: TransactionSignature,
    rpcTransaction: RawTransactionV1,
    signatureInfo: ConfirmedSignatureInfo,
  ): AlephParsedTransaction {
    const rawTransaction: RawTransaction = {
      ...rpcTransaction,
      ...signatureInfo,
      signature,
    }

    const transactionParser = this.parsers.transaction as TransactionParser
    if (!transactionParser) throw new Error('Transaction parser not configured')

    return transactionParser.parse(rawTransaction)
  }

  protected isTransaction(
    txOrSignatureInfo: AlephParsedTransaction | ConfirmedSignatureInfo,
  ): txOrSignatureInfo is AlephParsedTransaction {
    return 'parsed' in txOrSignatureInfo
  }

  protected async fetchHistory(
    chunk: ConfirmedSignatureInfo[],
    txsPerRequest: number,
    concurrentTxRequests: number,
  ): Promise<AlephParsedTransaction[]> {
    const chunkMap: Record<number, AlephParsedTransaction[]> = {}

    // @note: Fetch N transactions per request
    const generator = this.getTransactionsBulkGenerator(
      chunk,
      chunkMap,
      txsPerRequest,
    )

    // @note: Do N concurrent requests at time
    await concurrentPromises(generator, concurrentTxRequests)

    // @note: We are sorting here the results as responses can be received unsorted
    // Sort from newest (lessest index) to oldest (greatest index)
    const chunkKeys = Object.keys(chunkMap) as unknown as number[]
    chunkKeys.sort((a, b) => a - b)

    return chunkKeys.reduce(
      (acc, index) => acc.concat(chunkMap[index]),
      [] as AlephParsedTransaction[],
    )
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
  }: OptimizedHistoryOptions): Promise<OptimizedHistoryResponse> {
    let chunk: OptimizedHistoryResponse['chunk'] = []
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

      const filteredHistory = history.filter((item) =>
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

  protected *getTransactionsGenerator(
    history: ConfirmedSignatureInfo[],
    chunkMap: Record<number, AlephParsedTransaction[]>,
  ): Generator<Promise<unknown>> {
    for (const [index, item] of history.entries()) {
      yield (async () => {
        const rawTx = await this.getTransaction(item.signature, item)
        chunkMap[index] = [rawTx]
      })()
    }
  }

  protected *getTransactionsBulkGenerator(
    history: ConfirmedSignatureInfo[],
    chunkMap: Record<number, AlephParsedTransaction[]>,
    chunkSize: number,
  ): Generator<Promise<unknown>> {
    for (let i = 0; i < history.length; i += chunkSize) {
      const firstIndex = i
      const lastIndex = i + Math.min(chunkSize, history.length - i)

      const signatures = history.slice(firstIndex, lastIndex)

      yield (async () => {
        // console.log(`Fetching from ${firstIndex} to ${lastIndex - 1}`)
        const rawTxs = await this.getTransactionBulk(signatures)
        chunkMap[firstIndex] = rawTxs
      })()
    }
  }

  protected filterSignature(
    item: ConfirmedSignatureInfo,
    errorFetching?: ErrorFetching,
    signatureBlacklist?: Set<string>,
  ): TransactionSignature | undefined {
    if (errorFetching) {
      if (errorFetching === ErrorFetching.SkipErrors && item.err) {
        return
      } else if (errorFetching === ErrorFetching.OnlyErrors && !item.err) {
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

  constructor(
    rpcs: (string | SolanaRPC)[],
    parsers: Parsers,
    rateLimit = false,
  ) {
    const dedup = rpcs
      .filter((rpc) => !!rpc)
      .map((rpc) => {
        return rpc instanceof SolanaRPC
          ? rpc
          : new SolanaRPC({
              RPC_ENDPOINT: rpc,
              PARSERS: parsers,
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
