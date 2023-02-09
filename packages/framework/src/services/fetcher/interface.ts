import {
  BlockchainRequestArgs,
  InvokeBlockchainMethodRequestArgs,
} from '../types.js'
import {
  FetchAccountEntitiesByDateRequestArgs,
  AddAccountEntityRequestArgs,
  DelAccountEntityRequestArgs,
  GetAccountEntityStateRequestArgs,
  AccountEntityHistoryState,
  FetcherStateRequestArgs,
  FetcherState,
  CheckEntityRequestArgs,
  EntityState,
  DelEntityRequestArgs,
  FetchEntitiesByIdRequestArgs,
} from './src/types.js'

/**
 * Provides outward facing methods from the fetcher service.
 */
export interface FetcherMsI {
  /**
   * Requests a new signature fetcher, which will fetch all txn signatures including a given account.
   * @param args Arguments for the fetcher.
   */
  addAccountEntityFetcher(args: AddAccountEntityRequestArgs): Promise<void>

  /**
   * Requests to remove a signature fetcher.
   * @param args The account to remove the fetcher from.
   */
  delAccountEntityFetcher(args: DelAccountEntityRequestArgs): Promise<void>

  /**
   * Returns a signature fetcher's state.
   * @param args The account to get the fetcher's state from.
   */
  getAccountEntityFetcherState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<AccountEntityHistoryState<unknown> | undefined>

  /**
   * Returns all txn signatures fetched for a given account by timestamp range as a stream.
   * @param args Account and timestamp range to get the signatures for.
   */
  fetchAccountEntitiesByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>>

  /**
   * Adds new signatures to the fetcher loop to fetch their related transactions.
   * @param args The signatures of the transactions to fetch.
   */
  fetchEntitiesById(args: FetchEntitiesByIdRequestArgs): Promise<void>

  /**
   * Invoke extended functionality of each specific blockchain
   * @param args The arguments for selecting a blockchain, a method and passing method arguments
   */
  invokeBlockchainMethod(
    args: InvokeBlockchainMethodRequestArgs<unknown>,
  ): Promise<unknown>

  /**
   * Returns global fetcher state and statistics.
   * @param args The broker nodeID of the fetcher to get the state from.
   */
  getFetcherState(args: FetcherStateRequestArgs): Promise<FetcherState[]>

  // Transaction specific methods

  /**
   * Returns the state of transactions in the pending indexing transactions pool.
   * @param args The txn signatures to get the state for.
   */
  getEntityState(args: CheckEntityRequestArgs): Promise<EntityState[]>

  /**
   * Force to delete the cached transaction (Useful when rpc nodes return flaw txs).
   * @param args TThe txn signatures to delete the cache for.
   */
  delEntityCache(args: DelEntityRequestArgs): Promise<void>
}

export interface FetcherClientI {
  addAccountEntityFetcher(
    args: Omit<AddAccountEntityRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void>

  delAccountEntityFetcher(
    args: Omit<DelAccountEntityRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void>

  getAccountEntityFetcherState(
    args: Omit<GetAccountEntityStateRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<AccountEntityHistoryState<unknown> | undefined>

  fetchAccountEntitiesByDate(
    args: Omit<
      FetchAccountEntitiesByDateRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<void | AsyncIterable<string[]>>

  fetchEntitiesById(
    args: Omit<FetchEntitiesByIdRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void>

  // Transaction specific methods

  getEntityState(
    args: Omit<CheckEntityRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<EntityState[]>

  delEntityCache(
    args: Omit<DelEntityRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void>
}
