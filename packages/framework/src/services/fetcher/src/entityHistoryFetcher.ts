import { compose } from 'node:stream'
import { StorageEntry, StorageStream, Utils } from '@aleph-indexer/core'
import {
  FetchAccountEntitiesByDateRequestArgs,
  AccountEntityHistoryFetcherState,
  AccountEntityHistoryState,
  AddAccountEntityRequestArgs,
  DelAccountEntityRequestArgs,
  GetAccountEntityStateRequestArgs,
} from './types.js'
import { FetcherMsClient } from '../client.js'
import { PendingAccountPayload, PendingAccountStorage } from './dal/account.js'
import { FetcherPool } from './fetcherPool.js'
import { BlockchainId, IndexableEntityType } from '../../../types.js'
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
  CU,
  HE extends AccountEntityHistoryStorageEntity,
> {
  protected pendingAccounts: FetcherPool<PendingAccountPayload>

  /**
   * Initialize the fetcher service.
   * @param blockchainId The blockchain identifier.
   * @param fetcherClient The Fetcher ms client.
   * @param accountDAL The account job storage.
   */
  constructor(
    protected blockchainId: BlockchainId,
    protected type: IndexableEntityType,
    protected fetcherClient: FetcherMsClient,
    protected accountDAL: PendingAccountStorage,
    protected accountEntityHistoryDAL: AccountEntityHistoryStorage<HE>,
    protected id = `${blockchainId}:${type}-history-accounts`,
  ) {
    this.pendingAccounts = new FetcherPool({
      id,
      interval: 0,
      concurrency: 100,
      dal: this.accountDAL,
      fetcherCache: true,
      getFetcher: ({ id, payload }) =>
        this.getAccountFetcher(id, payload.params),
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

    const payload: PendingAccountPayload = {
      peers: indexerId ? [indexerId] : [],
      params: args.params,
    }

    const work = {
      id: account,
      time: Date.now(),
      payload,
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

    work.payload.peers = work.payload.peers.filter((id) => id !== indexerId)

    if (work.payload.peers.length > 0) {
      await this.pendingAccounts.addWork(work)
    } else {
      await this.pendingAccounts.removeWork(work)
    }
  }

  async getState(): Promise<AccountEntityHistoryFetcherState> {
    const accountFetchers = await this.pendingAccounts.getCount()
    return { accountFetchers }
  }

  async fetchAccountEntitiesByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    const { account, startDate, endDate } = args

    const state = await this.getAccountState({
      type: this.type,
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

    const entitiesQuery = await this.queryEntitiesByDate(args)

    return compose(
      entitiesQuery,
      new StreamMap(({ value }: StorageEntry<string, HE>) => value.id),
      new StreamBuffer(1000),
      new StreamMap(async (ids: string[]) => {
        await this.fetchAccountEntitiesByIdFromDateRange(ids, args)
        return ids
      }),
    )
  }

  protected async fetchAccountEntitiesByIdFromDateRange(
    ids: string[],
    byDateArgs: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void> {
    const { indexerId } = byDateArgs

    // @note: Use the client here for load balancing ids through all fetcher instances
    await this.fetcherClient
      .useBlockchain(this.blockchainId)
      .fetchEntitiesById({ type: this.type, ids, indexerId, meta: byDateArgs })
  }

  protected async getPartialAccountState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<AccountEntityHistoryState<CU> | undefined> {
    const { account } = args

    // Get the account work to retrieve params
    const accountWork = await this.accountDAL.getFirstValueFromTo(
      [account],
      [account],
    )
    const params = accountWork?.payload?.params

    const fetcher = this.getAccountFetcher(args.account, params)
    const fetcherState = await fetcher.getState()
    if (!fetcherState) return

    const completeHistory = await fetcher.isComplete('backward')

    return {
      fetcher: this.fetcherClient.getNodeId() || 'unknown',
      type: this.type,
      blockchain: this.blockchainId,
      cursors: fetcherState.cursors,
      account,
      completeHistory,
      params,
    }
  }

  protected async queryEntitiesByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<StorageStream<string, HE>> {
    const { account, startDate, endDate } = args

    return this.accountEntityHistoryDAL
      .useIndex(AccountEntityHistoryDALIndex.AccountTimestampIndex)
      .getAllFromTo([account, startDate], [account, endDate], {
        reverse: false,
      })
  }

  abstract getAccountState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<AccountEntityHistoryState<CU> | undefined>

  protected abstract getAccountFetcher(
    account: string,
    params: Record<string, unknown> | undefined,
  ): BaseHistoryFetcher<CU>
}
