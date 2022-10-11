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
  FetcherAccountPartitionRequestArgs,
  AddAccountInfoFetcherRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetchAccountTransactionsBySlotRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  FetcherStateRequestArgs,
  FetcherState,
  SignatureFetcherState,
  FetcherOptionsTypes,
  TransactionState,
  CheckTransactionsRequestArgs,
  DelTransactionsRequestArgs,
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

const { BufferExec, StreamBuffer, StreamMap, sleep } = Utils

/**
 * The main class of the fetcher service.
 */
export class FetcherMsMain implements FetcherMsI, PrivateFetcherMsI {
  protected fetchers: Record<string, SignatureFetcher> = {}
  protected infoFetchers: Record<string, AccountInfoFetcher> = {}
  protected pendingTransactions: PendingWorkPool<string[]>
  protected fetcherMsClient: FetcherMsClient
  protected throughput = 0
  protected throughputInit = Date.now()

  /**
   * Initialize the fetcher service.
   * @param broker The moleculer broker to assign to the service.
   * @param signatureDAL The transaction signatures' storage.
   * @param pendingTransactionDAL The pending transactions' storage.
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
    protected pendingTransactionDAL: PendingTransactionStorage,
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
      chunkSize: 1000,
      concurrency: 10,
      dal: this.pendingTransactionDAL,
      handleWork: this._fetchTransactions.bind(this),
      checkComplete: async (work): Promise<boolean> => {
        return (
          !this.isSignature(work.id) || this.rawTransactionDAL.exists(work.id)
        )
      },
    })
  }

  /**
   * Initialize the fetcher service.
   * First fetches pending transactions and parses them, then loads existing
   * requests to the service.
   */
  async start(): Promise<void> {
    this.pendingTransactions.start().catch(() => 'ignore')
    await this.loadExistingRequests()
  }

  async stop(): Promise<void> {
    this.pendingTransactions.stop().catch(() => 'ignore')
  }

  // @todo: Make the Main class moleculer-agnostic by DI
  getAllFetchers(): string[] {
    return this.fetcherMsClient.getAllFetchers()
  }

  async addAccountFetcher(
    args: FetcherAccountPartitionRequestArgs,
    save = true,
  ): Promise<void> {
    const { account } = args

    let fetcher = this.fetchers[account]
    if (fetcher) return

    fetcher = new SignatureFetcher(
      account,
      this.signatureDAL,
      this.solanaRpc,
      this.solanaMainPublicRpc,
      this.fetcherStateDAL,
    )

    this.fetchers[account] = fetcher

    if (save) {
      const fetcherOptions = createFetcherOptions(
        FetcherOptionsTypes.AccountFetcher,
        args,
      )

      await this.requestDAL.save(fetcherOptions)
    }

    await fetcher.init()
    fetcher.run()
  }

  async delAccountFetcher({
    account,
  }: FetcherAccountPartitionRequestArgs): Promise<void> {
    const fetcher = this.fetchers[account]
    if (!fetcher) return

    await fetcher.stop()
    delete this.fetchers[account]

    await this.removeExistingRequest(
      FetcherOptionsTypes.AccountFetcher,
      account,
    )
  }

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

  async getAccountFetcherState({
    account,
  }: FetcherAccountPartitionRequestArgs): Promise<
    SignatureFetcherState | undefined
  > {
    const fetcher = this.fetchers[account]
    if (!fetcher) return

    const state = await fetcher.getState()
    if (state) state.fetcher = this.getFetcherId()

    return state
  }

  async getFetcherState({
    fetcher = this.getFetcherId(),
  }: FetcherStateRequestArgs): Promise<FetcherState> {
    const pendingTransactions = await this.pendingTransactions.getCount()
    const accountFetchers = Object.keys(this.fetchers).length

    return {
      fetcher,
      pendingTransactions,
      accountFetchers,
      transactionThroughput: Math.round(
        this.throughput / ((Date.now() - this.throughputInit) / 1000),
      ),
    }
  }

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

  protected async _fetchTransactions(
    works: PendingWork<string[]>[],
  ): Promise<number | void> {
    console.log(`Txs fetching | Start fetching txs ${works.length}`)

    let totalPendings = 0

    const foundBuffer = new BufferExec<RawTransactionWithPeers>(async (txs) => {
      await this.emitTransactions(txs)
    }, 10)

    const requestBuffer = new BufferExec<PendingWork<string[]>>(
      async (works) => {
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
        await foundBuffer.add(txs)
      },
      200,
    )

    let count1 = 0
    let count2 = 0

    for (const work of works) {
      const { id: signature, payload: peers } = work
      const tx = await this.rawTransactionDAL.get(signature)

      if (!tx) {
        count1++
        await requestBuffer.add(work)
      } else {
        count2++
        const txWithPeers = { tx: tx as RawTransaction, peers }
        await foundBuffer.add(txWithPeers)
      }
    }

    console.log(
      `Txs fetching | Response ${count1}/${count2} requests/found${
        totalPendings > 0 ? `, ${totalPendings} errors` : ''
      }`,
    )

    await requestBuffer.drain()
    await foundBuffer.drain()

    if (totalPendings > 0) return 1000 * 5
  }

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

  protected async emitTransactions(
    txs: RawTransactionWithPeers[],
  ): Promise<void> {
    if (!txs.length) return

    console.log(`✉️  ${txs.length} txs sent by the fetcher...`)
    this.addThroughput(txs.length)
    return this.broker.emit('fetcher.txs', txs, [MsIds.Parser])
  }

  protected isSignature(signature: string): boolean {
    const isSignature = signature.length >= 64 && signature.length <= 88
    if (!isSignature) console.log(`Fetcher Invalid signature ${signature}`)
    return isSignature
  }

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

  protected async loadExistingRequests(): Promise<void> {
    console.log(`🔗 Loading existing requests ...`)
    const requests = await this.requestDAL.getAllValues()

    for await (const value of requests) {
      const { type, options } = value

      switch (type) {
        case FetcherOptionsTypes.AccountFetcher:
          await this.addAccountFetcher(options, false)
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
