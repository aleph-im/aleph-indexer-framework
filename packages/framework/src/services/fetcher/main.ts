import { pipeline } from 'node:stream'
import { DateTime } from 'luxon'
import { ServiceBroker } from 'moleculer'
import {
  AccountInfoFetcher,
  AccountInfoStorage,
  FetcherStateLevelStorage,
  PendingWork,
  PendingWorkPool,
  RawTransaction,
  RawTransactionV1,
  Signature,
  SolanaRPC,
  StorageEntry,
  Utils,
} from '@aleph-indexer/core'
import { SignatureFetcher } from './src/signatureFetcher.js'
import { FetcherMsI, PrivateFetcherMsI } from './interface.js'
import { SignatureDALIndex, SignatureStorage } from './src/dal/signature.js'
import { RawTransactionStorage } from './src/dal/rawTransaction.js'
import {
  AddAccountInfoFetcherRequestArgs,
  CheckTransactionsRequestArgs,
  DelTransactionsRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetchAccountTransactionsBySlotRequestArgs,
  FetcherAccountPartitionRequestArgs,
  FetcherOptionsTypes,
  FetcherState,
  FetcherStateRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  SignatureFetcherState,
  TransactionState,
} from './src/types.js'
import { PendingTransactionStorage } from './src/dal/pendingTransaction.js'
import { MsIds } from '../common.js'
import {
  createFetcherOptions,
  FetcherOptionsStorage,
  RequestsDALIndex,
} from './src/dal/requests.js'
import { FetcherMsClient } from './client.js'
import { RawTransactionWithPeers } from '../parser/src/types.js'
import { AccountStorage } from './src/dal/account'

const { StreamBuffer, StreamMap, sleep } = Utils

/**
 * The main class of the fetcher service.
 */
export class FetcherMsMain implements FetcherMsI, PrivateFetcherMsI {
  protected accounts: PendingWorkPool<string[]>
  protected infoFetchers: Record<string, AccountInfoFetcher> = {}
  protected pendingTransactions: PendingWorkPool<string[]>
  protected pendingTransactionsCache: PendingWorkPool<string[]>
  protected pendingTransactionsFetch: PendingWorkPool<string[]>
  protected fetcherMsClient: FetcherMsClient
  protected throughput = 0
  protected throughputInit = Date.now()

  /**
   * Initialize the fetcher service.
   * @param broker The moleculer broker to assign to the service.
   * @param signatureDAL The transaction signatures' storage.
   * @param accountDAL The account job storage.
   * @param pendingTransactionDAL The pending transactions' storage.
   * @param pendingTransactionCacheDAL
   * @param pendingTransactionFetchDAL
   * @param rawTransactionDAL The raw transactions' storage.
   * @param accountInfoDAL The account info storage.
   * @param requestDAL The fetcher requests' storage.
   * @param solanaRpc The solana RPC client to use.
   * @param solanaMainPublicRpc The solana mainnet public RPC client to use.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected broker: ServiceBroker,
    protected signatureDAL: SignatureStorage,
    protected accountDAL: AccountStorage,
    protected pendingTransactionDAL: PendingTransactionStorage,
    protected pendingTransactionCacheDAL: PendingTransactionStorage,
    protected pendingTransactionFetchDAL: PendingTransactionStorage,
    protected rawTransactionDAL: RawTransactionStorage,
    protected accountInfoDAL: AccountInfoStorage,
    protected requestDAL: FetcherOptionsStorage,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    protected fetcherStateDAL: FetcherStateLevelStorage,
  ) {
    this.fetcherMsClient = new FetcherMsClient(broker)

    this.pendingTransactions = new PendingWorkPool({
      id: 'pending-transactions',
      interval: 0,
      chunkSize: 500,
      concurrency: 1,
      dal: this.pendingTransactionDAL,
      handleWork: this._handlePendingTransactions.bind(this),
      checkComplete: () => true,
    })

    this.pendingTransactionsCache = new PendingWorkPool({
      id: 'pending-transactions-cache',
      interval: 0,
      chunkSize: 10,
      concurrency: 1,
      dal: this.pendingTransactionCacheDAL,
      handleWork: this._handlePendingTransactionsCache.bind(this),
      checkComplete: () => true,
    })

    this.pendingTransactionsFetch = new PendingWorkPool({
      id: 'pending-transactions-fetch',
      interval: 0,
      chunkSize: 100,
      concurrency: 5,
      dal: this.pendingTransactionFetchDAL,
      handleWork: this._handlePendingTransactionsFetch.bind(this),
      checkComplete: (work): Promise<boolean> =>
        this.rawTransactionDAL.exists(work.id),
    })

    this.accounts = new PendingWorkPool({
      id: 'accounts',
      interval: 0,
      chunkSize: 100,
      concurrency: 1,
      dal: this.accountDAL,
      handleWork: this._handleAccounts.bind(this),
      checkComplete: () => false,
    })
  }

  /**
   * Initialize the fetcher service.
   * First fetches pending transactions and parses them, then loads existing
   * requests to the service.
   */
  async start(): Promise<void> {
    this.pendingTransactions.start().catch(() => 'ignore')
    this.pendingTransactionsCache.start().catch(() => 'ignore')
    this.pendingTransactionsFetch.start().catch(() => 'ignore')
    this.accounts.start().catch(() => 'ignore')

    await this.loadExistingRequests()
  }

  async stop(): Promise<void> {
    this.pendingTransactions.stop().catch(() => 'ignore')
    this.pendingTransactionsCache.stop().catch(() => 'ignore')
    this.pendingTransactionsFetch.stop().catch(() => 'ignore')
    this.accounts.stop().catch(() => 'ignore')
  }

  // @todo: Make the Main class moleculer-agnostic by DI
  getAllFetchers(): string[] {
    return this.fetcherMsClient.getAllFetchers()
  }

  /**
   * Assigns to a fetcher instance an account owned by the specific program
   * and initializes it.
   * @param args Account address to assign to the fetcher instance
   */
  async addAccountFetcher(
    args: FetcherAccountPartitionRequestArgs,
  ): Promise<void> {
    const { account, indexerId } = args

    const work = {
      id: account,
      time: Date.now(),
      payload: indexerId ? [indexerId] : [],
    }

    await this.accounts.addWork(work)
  }

  /**
   * Stops the fetching process of that instance of the fetcher for that account.
   * @param account The account address to stop the fetching process.
   * @param indexerId Indexer that have made the request
   */
  async delAccountFetcher({
    account,
    indexerId,
  }: FetcherAccountPartitionRequestArgs): Promise<void> {
    if (!indexerId) return

    const work = await this.accountDAL.getFirstValueFromTo([account], [account])
    if (!work) return

    work.payload = work.payload.filter((id) => id !== indexerId)

    if (work.payload.length > 0) {
      await this.accounts.addWork(work)
    } else {
      await this.accounts.removeWork(work)
    }
  }

  /**
   * Creates an account info fetcher.
   * Allows to obtain the current state of the account
   * @param args Consists of the account address and a boolean to determine
   * whether to update its status if neccesary
   * @param save Save the request on the database
   */
  async addAccountInfoFetcher(
    args: AddAccountInfoFetcherRequestArgs,
    save = true,
  ): Promise<void> {
    const { account, subscribeChanges = true } = args

    let fetcher = this.infoFetchers[account]
    if (fetcher) return

    const options = {
      address: account,
      subscribeChanges,
    }

    fetcher = new AccountInfoFetcher(
      options,
      this.accountInfoDAL,
      this.solanaRpc,
      this.solanaMainPublicRpc,
    )

    this.infoFetchers[account] = fetcher

    if (save) {
      const fetcherOptions = createFetcherOptions(
        FetcherOptionsTypes.AccountInfoFetcher,
        args,
      )

      await this.requestDAL.save(fetcherOptions)
    }

    await fetcher.init()
    fetcher.run()
  }

  /**
   * Removes an account info fetcher from the map and its existing requests.
   * @param account The account address to remove from the map.
   */
  async delAccountInfoFetcher({
    account,
  }: FetcherAccountPartitionRequestArgs): Promise<void> {
    const fetcher = this.infoFetchers[account]
    if (!fetcher) return

    await fetcher.stop()
    delete this.infoFetchers[account]

    await this.removeExistingRequest(
      FetcherOptionsTypes.AccountInfoFetcher,
      account,
    )
  }

  /**
   * Returns the state of the transaction fetch process of a given account.
   * @param account The account address to get its fetch status.
   */
  async getAccountFetcherState({
    account,
  }: FetcherAccountPartitionRequestArgs): Promise<
    SignatureFetcherState | undefined
  > {
    const fetcher = new SignatureFetcher(
      account,
      this.signatureDAL,
      this.solanaRpc,
      this.solanaMainPublicRpc,
      this.fetcherStateDAL,
    )

    await fetcher.init()
    const state = await fetcher.getState()
    if (state) state.fetcher = this.getFetcherId()

    return state
  }

  /**
   * Returns the state of the complete fetch process.
   */
  async getFetcherState({
    fetcher = this.getFetcherId(),
  }: FetcherStateRequestArgs): Promise<FetcherState> {
    const pendingTransactions = await this.pendingTransactions.getCount()
    const accountFetchers = await this.accounts.getCount()

    return {
      fetcher,
      pendingTransactions,
      accountFetchers,
      transactionThroughput: Math.round(
        this.throughput / ((Date.now() - this.throughputInit) / 1000),
      ),
    }
  }

  /**
   * Returns the fetch status of certain txn signatures.
   * @param signatures The txn signatures to get its state.
   */
  async getTransactionState({
    signatures,
  }: CheckTransactionsRequestArgs): Promise<TransactionState[]> {
    const firstPending = await this.pendingTransactions.getFirstValue()

    return Promise.all(
      signatures.map(async (signature: string) => {
        const data = await this.rawTransactionDAL.get(signature)
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
          fetcher: this.getFetcherId(),
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
  async delTransactionCache({
    signatures,
  }: DelTransactionsRequestArgs): Promise<void> {
    const entities = signatures.map((signature) => ({
      transaction: { signatures: [signature] },
    })) as unknown as RawTransactionV1[]

    await this.rawTransactionDAL.remove(entities)
  }

  async fetchAccountTransactionsByDate(
    args: FetchAccountTransactionsByDateRequestArgs,
    save = true,
  ): Promise<void | AsyncIterable<string[]>> {
    const { account, startDate, endDate, indexerId } = args

    const state = await this.getAccountFetcherState({ account })
    if (!state) return

    const fetcherOptions = createFetcherOptions(
      FetcherOptionsTypes.AccountTransactionDateFetcher,
      args,
    )
    if (save) {
      await this.requestDAL.save(fetcherOptions)
    }

    const {
      completeHistory,
      firstTimestamp = Number.MAX_SAFE_INTEGER,
      lastTimestamp = 0,
    } = state

    // @todo: make sure that there wont be incomplete ranges on the right
    // containing transactions with the same timestamp, in that case we
    // are lossing data
    const inRange =
      (completeHistory || startDate > firstTimestamp) &&
      endDate <= lastTimestamp

    if (!inRange) return

    const signaturesQuery = await this.signatureDAL
      .useIndex(SignatureDALIndex.AccountTimestampIndex)
      .getAllFromTo([account, startDate], [account, endDate], {
        reverse: false,
      })

    return pipeline(
      signaturesQuery,
      new StreamMap(
        ({ value }: StorageEntry<string, Signature>) => value.signature,
      ),
      new StreamBuffer(1000),
      new StreamMap(async (signatures: string[]) => {
        // @note: Use the client here for load balancing signatures through all fetcher instances
        await this.fetcherMsClient.fetchTransactionsBySignature({
          signatures,
          indexerId,
        })
        return signatures
      }),
      async (err) => {
        if (!err && save) {
          await this.requestDAL.remove(fetcherOptions).catch(() => 'ignore')
        }
      },
    )
  }

  /**
   * Fetch transactions from an account by slot.
   * @param args accountAddress, startDate, endDate and indexerId.
   * @param save Save the request on the database
   */
  async fetchAccountTransactionsBySlot(
    args: FetchAccountTransactionsBySlotRequestArgs,
    save = true,
  ): Promise<void | AsyncIterable<string[]>> {
    const { account, startSlot, endSlot, indexerId } = args

    const state = await this.getAccountFetcherState({ account })
    if (!state) return

    const fetcherOptions = createFetcherOptions(
      FetcherOptionsTypes.AccountTransactionSlotFetcher,
      args,
    )

    if (save) {
      await this.requestDAL.save(fetcherOptions)
    }

    const {
      completeHistory,
      firstSlot = Number.MAX_SAFE_INTEGER,
      lastSlot = 0,
    } = state

    const inRange =
      (completeHistory || startSlot > firstSlot) && endSlot <= lastSlot

    if (!inRange) return

    const signaturesQuery = await this.signatureDAL
      .useIndex(SignatureDALIndex.AccountSlotIndex)
      .getAllFromTo([account, startSlot], [account, endSlot], {
        reverse: false,
      })

    return pipeline(
      signaturesQuery,
      new StreamMap(
        ({ value }: StorageEntry<string, Signature>) => value.signature,
      ),
      new StreamBuffer(1000),
      new StreamMap(async (signatures: string[]) => {
        // @note: Use the client here for load balancing signatures through all fetcher instances
        await this.fetcherMsClient.fetchTransactionsBySignature({
          signatures,
          indexerId,
        })
        return signatures
      }),
      async (err) => {
        if (!err && save) {
          await this.requestDAL.remove(fetcherOptions).catch(() => 'ignore')
        }
      },
    )
  }

  /**
   * Fetch transactions from an account by signatures.
   * @param args Txn signatures.
   */
  async fetchTransactionsBySignature({
    signatures,
    indexerId,
  }: FetchTransactionsBySignatureRequestArgs): Promise<void> {
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
   * Fetch signatures from accounts.
   * @param works Txn signatures with extra properties as time and payload.
   */
  protected async _handleAccounts(
    works: PendingWork<string[]>[],
  ): Promise<void> {
    console.log(`Accounts | Start handling ${works.length} accounts`)

    const accounts = works.map((work) => work.id)

    for (const account of accounts) {
      const fetcher = new SignatureFetcher(
        account,
        this.signatureDAL,
        this.solanaRpc,
        this.solanaMainPublicRpc,
        this.fetcherStateDAL,
        1,
      )

      await fetcher.init()
      await fetcher.run()
    }
  }

  /**
   * Fetch transactions from signatures.
   * @param works Txn signatures with extra properties as time and payload.
   */
  protected async _handlePendingTransactions(
    works: PendingWork<string[]>[],
  ): Promise<void> {
    console.log(`Txs pending | Start handling txs ${works.length}`)

    const toFetchWorks: PendingWork<string[]>[] = []
    const inCacheWorks: PendingWork<string[]>[] = []

    const ids = works.map((work) => work.id)
    const txs = await this.rawTransactionDAL.getMany(ids)

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

  protected async _handlePendingTransactionsCache(
    works: PendingWork<string[]>[],
  ): Promise<void> {
    console.log(`Txs cache | Start getting txs ${works.length}`)

    const txs = await this.rawTransactionDAL.getMany(
      works.map((work) => work.id),
    )

    const msgs = works.map((work, i) => ({
      tx: txs[i] as RawTransaction,
      peers: work.payload,
    }))

    await this.emitTransactions(msgs)

    console.log(`Txs cache | Response ${msgs.length} found in cache`)
  }

  protected async _handlePendingTransactionsFetch(
    works: PendingWork<string[]>[],
  ): Promise<number | void> {
    console.log(`Txs fetching | Start fetching txs ${works.length}`)

    let totalPendings = 0

    let [txs, pending] = await this._fetchFromRPC(works, this.solanaRpc)
    let retries = 0

    while (pending.length > 0 && retries < 3) {
      if (retries > 0) await sleep(1000)

      console.log(`⚠️ retrying ${pending.length} txs [${retries}]`)

      const [txs2, pending2] = await this._fetchFromRPC(
        pending,
        this.solanaMainPublicRpc,
      )

      pending = pending2
      txs = txs.concat(txs2)

      retries++
    }

    if (pending.length) {
      console.log(`‼️ ${pending.length} txs not found after 3 retries`)
      totalPendings += pending.length
    }

    await this.rawTransactionDAL.save(txs.map(({ tx }) => tx))

    const cacheWorks = txs.map(({ tx, peers }) => ({
      id: tx.transaction.signatures[0],
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

  /**
   * Fetch transactions from a RPC Node.
   * @param works Txn signatures with extra properties as time and payload.
   * @param rpc RPC endpoint to use
   */
  protected async _fetchFromRPC(
    works: PendingWork<string[]>[],
    rpc: SolanaRPC,
  ): Promise<[RawTransactionWithPeers[], PendingWork<string[]>[]]> {
    const signatures = works.map(({ id }) => id)
    const response = await rpc.getConfirmedTransactions(signatures, {
      shallowErrors: true,
    })

    const pendingWork: PendingWork<string[]>[] = []
    const txs: RawTransactionWithPeers[] = []

    for (const [i, tx] of response.entries()) {
      const work = works[i]

      if (tx === null) {
        pendingWork.push(work)
      } else {
        txs.push({ tx: tx as RawTransaction, peers: work.payload })
      }
    }

    await this.rawTransactionDAL.save(txs.map(({ tx }) => tx))

    return [txs, pendingWork]
  }

  /**
   * Emit txns to the parser.
   * @param txs Raw txns.
   */
  protected async emitTransactions(
    txs: RawTransactionWithPeers[],
  ): Promise<void> {
    if (!txs.length) return

    console.log(`✉️  ${txs.length} txs sent by the fetcher...`)
    this.addThroughput(txs.length)
    return this.broker.emit('fetcher.txs', txs, [MsIds.Parser])
  }

  /**
   * Guard to validate a signature.
   * @param signature Signature to validate.
   */
  protected isSignature(signature: string): boolean {
    const isSignature = signature.length >= 64 && signature.length <= 88
    if (!isSignature) console.log(`Fetcher Invalid signature ${signature}`)
    return isSignature
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
   * It is used to restart the execution of the fetcher by loading the existing requests.
   */
  protected async loadExistingRequests(): Promise<void> {
    console.log(`🔗 Loading existing requests ...`)
    const requests = await this.requestDAL.getAllValues()

    for await (const value of requests) {
      const { type, options } = value

      switch (type) {
        case FetcherOptionsTypes.AccountFetcher:
          await this.addAccountFetcher(options)
          break
        case FetcherOptionsTypes.AccountInfoFetcher:
          await this.addAccountInfoFetcher(options, false)
          break
        case FetcherOptionsTypes.AccountTransactionDateFetcher:
          await this.fetchAccountTransactionsByDate(options, false)
          break
        case FetcherOptionsTypes.AccountTransactionSlotFetcher:
          await this.fetchAccountTransactionsBySlot(options, false)
          break
      }
    }
  }

  /**
   * Removes the existing requests related to a certain account and type of request.
   * @param type One of the possible requests that can be made to the fetcher service.
   * @param account Account address.
   */
  protected async removeExistingRequest(
    type: FetcherOptionsTypes,
    account: string,
  ): Promise<void> {
    if (type === FetcherOptionsTypes.TransactionSignatureFetcher) return

    const requests = await this.requestDAL
      .useIndex(RequestsDALIndex.TypeAccount)
      .getAllValuesFromTo([type, account], [type, account])

    for await (const value of requests) {
      this.requestDAL.remove(value)
    }
  }

  // @todo: Make the Main class moleculer-agnostic by DI
  protected getFetcherId(): string {
    return this.broker.nodeID
  }
}
