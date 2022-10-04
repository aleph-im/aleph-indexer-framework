import {
  FetcherAccountPartitionRequestArgs,
  AddAccountInfoFetcherRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetchAccountTransactionsBySlotRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  FetcherState,
  FetcherStateRequestArgs,
  SignatureFetcherState,
  TransactionState,
  CheckTransactionsRequestArgs,
} from './src/types'

/**
 * Provides outward facing methods from the fetcher service.
 */
export interface FetcherMsI {
  /**
   * Requests a new signature fetcher, which will fetch all txn signatures including a given account.
   * @param args Arguments for the fetcher.
   */
  addAccountFetcher(
    args: FetcherAccountPartitionRequestArgs,
  ): Promise<void>
  /**
   * Returns a signature fetcher's state.
   * @param args The account to get the fetcher's state from.
   */
  getAccountFetcherState(
    args: FetcherAccountPartitionRequestArgs,
  ): Promise<SignatureFetcherState | undefined>
  /**
   * Requests a new account info fetcher, which will fetch current account info.
   * @param args Arguments for the fetcher.
   */
  addAccountInfoFetcher(
    args: AddAccountInfoFetcherRequestArgs,
  ): Promise<void>
  /**
   * Returns all txn signatures fetched for a given account by timestamp range as a stream.
   * @param args Account and timestamp range to get the signatures for.
   */
  fetchAccountTransactionsByDate(
    args: FetchAccountTransactionsByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>>
  /**
   * Returns all txn signatures fetched for a given account by slot range as a stream.
   * @param args Account and slot range to get the signatures for.
   */
  fetchAccountTransactionsBySlot(
    args: FetchAccountTransactionsBySlotRequestArgs,
  ): Promise<void | AsyncIterable<string[]>>
  /**
   * Adds new signatures to the fetcher loop to fetch their related transactions.
   * @param args The signatures of the transactions to fetch.
   */
  fetchTransactionsBySignature(
    args: FetchTransactionsBySignatureRequestArgs,
  ): Promise<void>
}

/**
 * Provides inward facing methods from the fetcher service.
 */
export interface PrivateFetcherMsI {
  /**
   * Gets all fetcher services from the registry.
   */
  getAllFetchers(): string[]
  /**
   * Returns global fetcher state and statistics.
   * @param args The broker nodeID of the fetcher to get the state from.
   */
  getFetcherState(
    args: FetcherStateRequestArgs,
  ): Promise<FetcherState>
  /**
   * Returns the state of transactions in the pending indexing transactions pool.
   * @param args The txn signatures to get the state for.
   */
  getTransactionState(
    args: CheckTransactionsRequestArgs,
  ): Promise<TransactionState[]>
  /**
   * Requests to remove a signature fetcher.
   * @param args The account to remove the fetcher from.
   */
  delAccountFetcher(
    args: FetcherAccountPartitionRequestArgs,
  ): Promise<void>
  /**
   * Requests to remove an account info fetcher.
   * @param args The account to remove the fetcher from.
   */
  delAccountInfoFetcher(
    args: FetcherAccountPartitionRequestArgs,
  ): Promise<void>
}
