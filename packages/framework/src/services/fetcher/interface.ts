import { Blockchain } from '@aleph-indexer/core'
import {
  AddAccountStateRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  AddAccountTransactionRequestArgs,
  DelAccountTransactionRequestArgs,
  GetAccountTransactionStateRequestArgs,
  AccountTransactionHistoryState,
  DelAccountStateRequestArgs,
  GetAccountStateStateRequestArgs,
  AccountStateState,
  InvokeBlockchainMethodRequestArgs,
  FetcherCommonRequestArgs,
  FetcherStateRequestArgs,
  FetcherState,
  CheckTransactionsRequestArgs,
  TransactionState,
  DelTransactionsRequestArgs,
} from './src/base/types'

/**
 * Provides outward facing methods from the fetcher service.
 */
export interface FetcherMsI {
  /**
   * Requests a new signature fetcher, which will fetch all txn signatures including a given account.
   * @param args Arguments for the fetcher.
   */
  addAccountTransactionFetcher(
    args: AddAccountTransactionRequestArgs,
  ): Promise<void>
  /**
   * Requests to remove a signature fetcher.
   * @param args The account to remove the fetcher from.
   */
  delAccountTransactionFetcher(
    args: DelAccountTransactionRequestArgs,
  ): Promise<void>
  /**
   * Returns a signature fetcher's state.
   * @param args The account to get the fetcher's state from.
   */
  getAccountTransactionFetcherState(
    args: GetAccountTransactionStateRequestArgs,
  ): Promise<AccountTransactionHistoryState<unknown> | undefined>
  /**
   * Requests a new account info fetcher, which will fetch current account info.
   * @param args Arguments for the fetcher.
   */
  addAccountStateFetcher(args: AddAccountStateRequestArgs): Promise<void>
  /**
   * Requests to remove a signature fetcher.
   * @param args The account to remove the fetcher from.
   */
  delAccountStateFetcher(args: DelAccountStateRequestArgs): Promise<void>
  /**
   * Returns a signature fetcher's state.
   * @param args The account to get the fetcher's state from.
   */
  getAccountStateFetcherState(
    args: GetAccountStateStateRequestArgs,
  ): Promise<AccountStateState<unknown> | undefined>
  /**
   * Returns all txn signatures fetched for a given account by timestamp range as a stream.
   * @param args Account and timestamp range to get the signatures for.
   */
  fetchAccountTransactionsByDate(
    args: FetchAccountTransactionsByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>>
  /**
   * Adds new signatures to the fetcher loop to fetch their related transactions.
   * @param args The signatures of the transactions to fetch.
   */
  fetchTransactionsBySignature(
    args: FetchTransactionsBySignatureRequestArgs,
  ): Promise<void>
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
  getFetcherState(
    args: FetcherStateRequestArgs,
  ): Promise<Record<Blockchain, FetcherState>>

  /**
   * Returns the state of transactions in the pending indexing transactions pool.
   * @param args The txn signatures to get the state for.
   */
  getTransactionState(
    args: CheckTransactionsRequestArgs,
  ): Promise<TransactionState[]>

  /**
   * Force to delete the cached transaction (Useful when rpc nodes return flaw txs).
   * @param args TThe txn signatures to delete the cache for.
   */
  delTransactionCache(args: DelTransactionsRequestArgs): Promise<void>
}

export type FetcherClientI = {
  addAccountTransactionFetcher(
    args: Omit<
      AddAccountTransactionRequestArgs,
      keyof FetcherCommonRequestArgs
    >,
  ): Promise<void>
  delAccountTransactionFetcher(
    args: Omit<
      DelAccountTransactionRequestArgs,
      keyof FetcherCommonRequestArgs
    >,
  ): Promise<void>
  getAccountTransactionFetcherState(
    args: Omit<
      GetAccountTransactionStateRequestArgs,
      keyof FetcherCommonRequestArgs
    >,
  ): Promise<AccountTransactionHistoryState<unknown> | undefined>
  addAccountStateFetcher(
    args: Omit<AddAccountStateRequestArgs, keyof FetcherCommonRequestArgs>,
  ): Promise<void>
  delAccountStateFetcher(
    args: Omit<DelAccountStateRequestArgs, keyof FetcherCommonRequestArgs>,
  ): Promise<void>
  getAccountStateFetcherState(
    args: Omit<GetAccountStateStateRequestArgs, keyof FetcherCommonRequestArgs>,
  ): Promise<AccountStateState<unknown> | undefined>
  fetchAccountTransactionsByDate(
    args: Omit<
      FetchAccountTransactionsByDateRequestArgs,
      keyof FetcherCommonRequestArgs
    >,
  ): Promise<void | AsyncIterable<string[]>>
  fetchTransactionsBySignature(
    args: Omit<
      FetchTransactionsBySignatureRequestArgs,
      keyof FetcherCommonRequestArgs
    >,
  ): Promise<void>

  getTransactionState(
    args: Omit<CheckTransactionsRequestArgs, keyof FetcherCommonRequestArgs>,
  ): Promise<TransactionState[]>

  delTransactionCache(
    args: Omit<DelTransactionsRequestArgs, keyof FetcherCommonRequestArgs>,
  ): Promise<void>
}

// /**
//  * Provides inward facing methods from the fetcher service.
//  */
// export interface PrivateFetcherMsI {
//   /**
//    * Gets all fetcher services from the registry.
//    */
//   getAllFetchers(): string[]
//   /**
//    * Returns global fetcher state and statistics.
//    * @param args The broker nodeID of the fetcher to get the state from.
//    */
//   getFetcherState(args: FetcherStateRequestArgs): Promise<FetcherState>
//   /**
//    * Returns the state of transactions in the pending indexing transactions pool.
//    * @param args The txn signatures to get the state for.
//    */
//   getTransactionState(
//     args: CheckTransactionsRequestArgs,
//   ): Promise<TransactionState[]>

//   /**
//    * Force to delete the cached transaction (Useful when rpc nodes return flaw txs).
//    * @param args TThe txn signatures to delete the cache for.
//    */
//   delTransactionCache(args: DelTransactionsRequestArgs): Promise<void>
// }
