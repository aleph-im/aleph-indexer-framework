import { DateTime } from 'luxon'
import { ServiceBroker } from 'moleculer'
import { PendingWork, PendingWorkPool, Utils } from '@aleph-indexer/core'
import { RawTransactionStorage } from './dal/rawTransaction.js'
import {
  CheckTransactionsRequestArgs,
  DelTransactionsRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  TransactionFetcherState,
  TransactionState,
} from './types.js'
import { MsIds } from '../../../common.js'
import { PendingTransactionStorage } from './dal/pendingTransaction.js'
import { RawTransactionWithPeers } from '../../../parser/src/base/types.js'
import { Blockchain, RawTransaction } from '../../../../types/common.js'

const { sleep } = Utils

/**
 * The main class of the fetcher service.
 */
export abstract class BaseTransactionFetcher<
  T extends RawTransaction = RawTransaction,
> {
  protected pendingTransactions: PendingWorkPool<string[]>
  protected pendingTransactionsCache: PendingWorkPool<string[]>
  protected pendingTransactionsFetch: PendingWorkPool<string[]>

  protected throughput = 0
  protected throughputInit = Date.now()

  /**
   * Initialize the fetcher service.
   * @param broker The moleculer broker to assign to the service.
   * @param pendingTransactionDAL The pending transactions' storage.
   * @param pendingTransactionCacheDAL
   * @param pendingTransactionFetchDAL
   * @param transactionCacheDAL The raw transactions' storage.
   */
  constructor(
    protected blockchainId: Blockchain,
    protected broker: ServiceBroker,
    protected pendingTransactionDAL: PendingTransactionStorage,
    protected pendingTransactionCacheDAL: PendingTransactionStorage,
    protected pendingTransactionFetchDAL: PendingTransactionStorage,
    protected transactionCacheDAL: RawTransactionStorage<T>,
  ) {
    this.pendingTransactionsCache = new PendingWorkPool({
      id: 'pending-transactions-cache',
      interval: 0,
      chunkSize: 10,
      concurrency: 1,
      dal: this.pendingTransactionCacheDAL,
      handleWork: this.handlePendingTransactionsCache.bind(this),
      checkComplete: () => true,
    })

    this.pendingTransactionsFetch = new PendingWorkPool({
      id: 'pending-transactions-fetch',
      interval: 0,
      chunkSize: 200,
      concurrency: 5,
      dal: this.pendingTransactionFetchDAL,
      handleWork: this.handlePendingTransactionsFetch.bind(this),
      checkComplete: (work): Promise<boolean> =>
        this.transactionCacheDAL.exists(work.id),
    })

    this.pendingTransactions = new PendingWorkPool({
      id: 'pending-transactions',
      interval: 0,
      chunkSize: 1000,
      concurrency: 1,
      dal: this.pendingTransactionDAL,
      handleWork: this.handlePendingTransactions.bind(this),
      checkComplete: () => true,
    })
  }

  async start(): Promise<void> {
    await this.pendingTransactionsCache.start()
    await this.pendingTransactionsFetch.start()
    await this.pendingTransactions.start()
  }

  async stop(): Promise<void> {
    await this.pendingTransactionsCache.stop()
    await this.pendingTransactionsFetch.stop()
    await this.pendingTransactions.stop()
  }

  async getState(): Promise<TransactionFetcherState> {
    const pendingTransactions = await this.pendingTransactions.getCount()

    return {
      pendingTransactions,
      transactionThroughput: Math.round(
        this.throughput / ((Date.now() - this.throughputInit) / 1000),
      ),
    }
  }

  /**
   * Returns the fetch status of certain txn signatures.
   * @param signatures The txn signatures to get its state.
   */
  async getTransactionState(
    args: CheckTransactionsRequestArgs,
  ): Promise<TransactionState[]> {
    const { signatures } = args
    const firstPending = await this.pendingTransactions.getFirstValue()

    return Promise.all(
      signatures.map(async (signature: string) => {
        const data = await this.transactionCacheDAL.get(signature)
        const pending = await this.pendingTransactions.get(signature)

        let pendingAddTime, pendingExecTime

        if (pending) {
          pendingAddTime = DateTime.fromMillis(pending.time).toUTC().toISO()
          pendingExecTime = DateTime.fromMillis(
            Date.now() + (pending.time - (firstPending?.time || pending.time)),
          )
            .toUTC()
            .toISO()
        }

        return {
          signature,
          isCached: !!data,
          isPending: !!pending,
          pendingAddTime,
          pendingExecTime,
          data,
        }
      }),
    )
  }

  /**
   * Delete the cached transaction.
   * @param args The txn signatures to delete the cache for.
   */
  async delTransactionCache(args: DelTransactionsRequestArgs): Promise<void> {
    const { signatures } = args
    const entities = signatures.map((signature) => {
      return { signature }
    }) as T[]

    await this.transactionCacheDAL.remove(entities)
  }

  /**
   * Fetch transactions from an account by signatures.
   * @param args Txn signatures.
   */
  async fetchTransactionsBySignature(
    args: FetchTransactionsBySignatureRequestArgs,
  ): Promise<void> {
    const { signatures, indexerId } = args

    console.log(
      `🔗 ${signatures.length} new signatures added to the fetcher queue... [${indexerId}]`,
    )

    const entities = signatures
      .filter(this.isSignature.bind(this))
      .map((signature) => ({
        id: signature,
        time: Date.now(),
        payload: indexerId ? [indexerId] : [],
      }))

    await this.pendingTransactions.addWork(entities)
  }

  /**
   * Fetch transactions from signatures.
   * @param works Txn signatures with extra properties as time and payload.
   */
  protected async handlePendingTransactions(
    works: PendingWork<string[]>[],
  ): Promise<void> {
    console.log(`Txs pending | Start handling txs ${works.length}`)

    const toFetchWorks: PendingWork<string[]>[] = []
    const inCacheWorks: PendingWork<string[]>[] = []

    const ids = works.map((work) => work.id)
    const txs = await this.transactionCacheDAL.getMany(ids)

    for (const [i, tx] of txs.entries()) {
      if (!tx) {
        toFetchWorks.push(works[i])
      } else {
        inCacheWorks.push(works[i])
      }
    }

    console.log(
      `Txs pending | Response ${toFetchWorks.length}/${inCacheWorks.length} toFetch/inCache`,
    )

    if (toFetchWorks.length > 0) {
      await this.pendingTransactionsFetch.addWork(toFetchWorks)
    }

    if (inCacheWorks.length > 0) {
      await this.pendingTransactionsCache.addWork(inCacheWorks)
    }
  }

  protected async handlePendingTransactionsCache(
    works: PendingWork<string[]>[],
  ): Promise<void> {
    console.log(`Txs cache | Start getting txs ${works.length}`)

    const txs = await this.transactionCacheDAL.getMany(
      works.map((work) => work.id),
    )

    const msgs = works.map((work, i) => ({
      tx: txs[i] as T,
      peers: work.payload,
    }))

    await this.emitTransactions(msgs)

    console.log(`Txs cache | Response ${msgs.length} found in cache`)
  }

  protected async handlePendingTransactionsFetch(
    works: PendingWork<string[]>[],
  ): Promise<number | void> {
    console.log(`Txs fetching | Start fetching txs ${works.length}`)

    let totalPendings = 0

    let [txs, pending] = await this.fetchSignatures(works, false)
    let retries = 3

    while (pending.length > 0 && retries-- > 0) {
      await sleep(1000)

      console.log(`⚠️ retrying ${pending.length} txs [${retries}]`)

      const [txs2, pending2] = await this.fetchSignatures(pending, true)

      pending = pending2
      txs = txs.concat(txs2)

      retries++
    }

    if (pending.length) {
      console.log(`‼️ ${pending.length} txs not found after 3 retries`)
      totalPendings += pending.length
    }

    await this.transactionCacheDAL.save(txs.map(({ tx }) => tx))

    const cacheWorks = txs.map(({ tx, peers }) => ({
      id: tx.signature,
      time: Date.now(),
      payload: peers,
    }))

    await this.pendingTransactionsCache.addWork(cacheWorks)

    console.log(
      `Txs fetching | Response ${txs.length} requests${
        totalPendings > 0 ? `, ${totalPendings} errors` : ''
      }`,
    )

    if (totalPendings > 0) return 1000 * 5
  }

  protected async fetchSignatures(
    works: PendingWork<string[]>[],
    isRetry = false,
  ): Promise<[RawTransactionWithPeers<T>[], PendingWork<string[]>[]]> {
    const signatures = works.map(({ id }) => id)

    const response = await this.remoteFetch(signatures, isRetry)

    if (response.length !== signatures.length)
      throw new Error('Invalid txs response length')

    const pendingWork: PendingWork<string[]>[] = []
    const txs: RawTransactionWithPeers<T>[] = []

    for (const [i, tx] of response.entries()) {
      const work = works[i]

      if (tx === null || tx === undefined) {
        pendingWork.push(work)
      } else {
        tx.signature = tx.signature || work.id
        const txWithPeers = { tx, peers: work.payload }
        txs.push(txWithPeers)
      }
    }

    return [txs, pendingWork]
  }

  /**
   * Emit txns to the parser.
   * @param txs Raw txns.
   */
  protected async emitTransactions(
    txs: RawTransactionWithPeers<T>[],
  ): Promise<void> {
    if (!txs.length) return

    console.log(`✉️  ${txs.length} txs sent by the fetcher...`)

    this.addThroughput(txs.length)

    return this.broker.emit(`fetcher.txs.${this.blockchainId}`, txs, [
      MsIds.Parser,
    ])
  }

  /**
   * Used to improve performance.
   * @param count Txns counter.
   */
  protected addThroughput(count: number): void {
    // @note: Reset if there is an overflow
    const now = Date.now()

    if (
      this.throughput >= Number.MAX_SAFE_INTEGER - count || // overflow
      now - this.throughputInit >= 1000 * 60 * 60 // >= 1 hour
    ) {
      this.throughput = 0
      this.throughputInit = now
    }

    this.throughput += count
  }

  /**
   * Fetch transactions from a RPC Node.
   * @param works Txn signatures with extra properties as time and payload.
   */
  protected abstract remoteFetch(
    signatures: string[],
    isRetry: boolean,
  ): Promise<(T | null | undefined)[]>

  /**
   * Guard to validate a signature.
   * @param signature Signature to validate.
   */
  protected abstract isSignature(signature: string): boolean
}
