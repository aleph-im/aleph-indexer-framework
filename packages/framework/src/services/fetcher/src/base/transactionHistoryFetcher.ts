import { compose } from 'node:stream'
import {
  BaseHistoryFetcher,
  Blockchain,
  PendingWork,
  PendingWorkPool,
  SolanaSignatureInfo,
  StorageEntry,
  Utils,
} from '@aleph-indexer/core'
import {
  FetchAccountTransactionsByDateRequestArgs,
  AccountTransactionHistoryFetcherState,
  AccountTransactionHistoryState,
  AddAccountTransactionRequestArgs,
  DelAccountTransactionRequestArgs,
  GetAccountTransactionStateRequestArgs,
} from './types.js'
import { FetcherMsClient } from '../../client.js'
import { PendingAccountStorage } from './dal/account.js'
import {
  AccountTransactionHistoryDALIndex,
  AccountTransactionHistoryStorage,
  AccountTransactionHistoryStorageEntity,
} from './dal/accountTransactionHistory.js'

const { StreamBuffer, StreamMap } = Utils

/**
 * The main class of the fetcher service.
 */
export abstract class BaseTransactionHistoryFetcher<
  C,
  S extends AccountTransactionHistoryStorageEntity,
> {
  protected pendingAccounts: PendingWorkPool<string[]>

  /**
   * Initialize the fetcher service.
   * @param blockchainId The blockchain identifier.
   * @param fetcherClient The Fetcher ms client.
   * @param accountSignatureDAL The transaction signatures' storage.
   * @param accountDAL The account job storage.
   */
  constructor(
    protected blockchainId: Blockchain,
    protected fetcherClient: FetcherMsClient,
    protected accountSignatureDAL: AccountTransactionHistoryStorage<S>,
    protected accountDAL: PendingAccountStorage,
  ) {
    this.pendingAccounts = new PendingWorkPool({
      id: 'accounts',
      interval: 0,
      chunkSize: 100,
      concurrency: 1,
      dal: this.accountDAL,
      handleWork: this._handleAccounts.bind(this),
      checkComplete: () => false,
    })
  }

  async start(): Promise<void> {
    await this.pendingAccounts.start()
  }

  async stop(): Promise<void> {
    await this.pendingAccounts.stop()
  }

  /**
   * Assigns to a fetcher instance an account owned by the specific program
   * and initializes it.
   * @param args Account address to asign to the fetcher instance,
   */
  async addAccount(args: AddAccountTransactionRequestArgs): Promise<void> {
    const { account, indexerId } = args

    const work = {
      id: account,
      time: Date.now(),
      payload: indexerId ? [indexerId] : [],
    }

    await this.pendingAccounts.addWork(work)
  }

  /**
   * Stops the fetching process of that instance of the fetcher for that account.
   * @param account The account address to stop the fetching process.
   */
  async delAccount({
    account,
    indexerId,
  }: DelAccountTransactionRequestArgs): Promise<void> {
    if (!indexerId) return

    const work = await this.accountDAL.getFirstValueFromTo([account], [account])
    if (!work) return

    work.payload = work.payload.filter((id) => id !== indexerId)

    if (work.payload.length > 0) {
      await this.pendingAccounts.addWork(work)
    } else {
      await this.pendingAccounts.removeWork(work)
    }
  }

  async getState(): Promise<AccountTransactionHistoryFetcherState> {
    const accountFetchers = await this.pendingAccounts.getCount()

    return { accountFetchers }
  }

  async fetchAccountTransactionsByDate(
    args: FetchAccountTransactionsByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    const { account, startDate, endDate, indexerId } = args

    const state = await this.getAccountState({
      blockchainId: this.blockchainId,
      account,
    })
    if (!state) return

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

    const signaturesQuery = await this.accountSignatureDAL
      .useIndex(AccountTransactionHistoryDALIndex.AccountTimestampIndex)
      .getAllFromTo([account, startDate], [account, endDate], {
        reverse: false,
      })

    return compose(
      signaturesQuery,
      new StreamMap(
        ({ value }: StorageEntry<string, SolanaSignatureInfo>) =>
          value.signature,
      ),
      new StreamBuffer(1000),
      new StreamMap(async (signatures: string[]) => {
        // @note: Use the client here for load balancing signatures through all fetcher instances
        await this.fetcherClient
          .useBlockchain(this.blockchainId)
          .fetchTransactionsBySignature({
            signatures,
            indexerId,
          })
        return signatures
      }),
    )
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
      const fetcher = this.getAccountFetcher(account)
      await fetcher.init()
      await fetcher.run()
    }
  }

  protected async getPartialAccountState<
    T extends AccountTransactionHistoryState<C>,
  >(args: GetAccountTransactionStateRequestArgs): Promise<T | undefined> {
    const { account } = args

    const fetcher = this.getAccountFetcher(args.account)
    const fetcherState = await fetcher.getState()
    if (!fetcherState) return

    return {
      fetcher: this.fetcherClient.getNodeId() || 'unknown',
      account,
      cursors: fetcherState.cursors,
      completeHistory: fetcher.isComplete('backward'),
    } as T
  }

  /**
   * Returns the state of the transaction fetch process of a given account.
   * @param args The account address to get its fetch status.
   */
  abstract getAccountState(
    args: GetAccountTransactionStateRequestArgs,
  ): Promise<AccountTransactionHistoryState<C> | undefined>

  protected abstract getAccountFetcher(account: string): BaseHistoryFetcher<C>
}
