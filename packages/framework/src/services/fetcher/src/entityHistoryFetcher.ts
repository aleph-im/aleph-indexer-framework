import { compose } from 'node:stream'
import { StorageEntry, Utils } from '@aleph-indexer/core'
import {
  FetchAccountEntitiesByDateRequestArgs,
  AccountEntityHistoryFetcherState,
  AccountEntityHistoryState,
  AddAccountEntityRequestArgs,
  DelAccountEntityRequestArgs,
  GetAccountEntityStateRequestArgs,
} from './types.js'
import { FetcherMsClient } from '../client.js'
import { PendingAccountStorage } from './dal/account.js'
import { FetcherPool } from './fetcherPool.js'
import { Blockchain } from '../../../types.js'
import { BaseHistoryFetcher } from './baseHistoryFetcher.js'
import {
  AccountEntityHistoryDALIndex,
  AccountEntityHistoryStorage,
  AccountEntityHistoryStorageEntity,
} from './dal/accountEntityHistory.js'

const { StreamBuffer, StreamMap } = Utils

/**
 * The main class of the fetcher service.
 */
export abstract class BaseEntityHistoryFetcher<
  C,
  E extends AccountEntityHistoryStorageEntity,
  S extends AccountEntityHistoryFetcherState = AccountEntityHistoryFetcherState,
> {
  protected pendingAccounts: FetcherPool<string[]>

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
    protected accountSignatureDAL: AccountEntityHistoryStorage<E>,
    protected accountDAL: PendingAccountStorage,
    protected id = `${blockchainId}:entity-history-accounts`,
  ) {
    this.pendingAccounts = new FetcherPool({
      id,
      interval: 0,
      concurrency: 1,
      dal: this.accountDAL,
      getFetcher: ({ id }) => this.getAccountFetcher(id),
      // checkComplete: () => false, // @note: Delegated to each baseFetcher
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
  async addAccount(args: AddAccountEntityRequestArgs): Promise<void> {
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
  async delAccount(args: DelAccountEntityRequestArgs): Promise<void> {
    const { account, indexerId } = args

    if (!indexerId) return

    const work = await this.accountDAL.getFirstValueFromTo([account], [account])
    if (!work) return

    work.payload = work.payload.filter((id) => id !== indexerId)

    await this.pendingAccounts.removeWork(work)

    if (work.payload.length > 0) {
      await this.pendingAccounts.addWork(work)
    }
  }

  async getPartialState(): Promise<AccountEntityHistoryFetcherState> {
    const accountFetchers = await this.pendingAccounts.getCount()
    return { accountFetchers }
  }

  async fetchAccountEntitiesByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    const { account, startDate, endDate, indexerId } = args

    const state = await this.getAccountState({
      blockchainId: this.blockchainId,
      account,
    })
    if (!state) return

    const { firstTimestamp = Number.MAX_SAFE_INTEGER, lastTimestamp = 0 } =
      state

    // @todo: make sure that there wont be incomplete ranges on the right
    // containing transactions with the same timestamp, in that case we
    // are lossing data
    const inRange = startDate >= firstTimestamp && endDate <= lastTimestamp
    if (!inRange) return

    const signaturesQuery = await this.accountSignatureDAL
      .useIndex(AccountEntityHistoryDALIndex.AccountTimestampIndex)
      .getAllFromTo([account, startDate], [account, endDate], {
        reverse: false,
      })

    return compose(
      signaturesQuery,
      new StreamMap(({ value }: StorageEntry<string, E>) =>
        this.getEntityId(value),
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

  protected async getPartialAccountState<
    T extends AccountEntityHistoryState<C>,
  >(args: GetAccountEntityStateRequestArgs): Promise<T | undefined> {
    const { account } = args

    const fetcher = this.getAccountFetcher(args.account)
    const fetcherState = await fetcher.getState()
    if (!fetcherState) return

    return {
      fetcher: this.fetcherClient.getNodeId() || 'unknown',
      blockchain: this.blockchainId,
      account,
      cursors: fetcherState.cursors,
      completeHistory: fetcher.isComplete('backward'),
    } as T
  }

  abstract getAccountState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<AccountEntityHistoryState<C> | undefined>

  abstract getState(): Promise<S>

  protected abstract getEntityId(entity: E): unknown
  protected abstract getAccountFetcher(account: string): BaseHistoryFetcher<C>
}
