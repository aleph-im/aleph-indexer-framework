import {
  BaseFetcherPaginationCursors,
  Blockchain,
  RawTransaction,
} from '@aleph-indexer/core'
import { BlockchainRequestArgs } from '../../../types.js'
import { FetcherMsClient } from '../../client.js'

export type AccountTransactionHistoryState<C> = {
  fetcher: string
  blockchain: Blockchain
  account: string
  completeHistory: boolean
  firstTimestamp?: number
  lastTimestamp?: number
  cursors?: BaseFetcherPaginationCursors<C>
}

// @todo
export type AccountStateState<T> = any

export type FetcherPartitionRequestArgs = BlockchainRequestArgs & {
  fetcher: string
}

export type TransactionFetcherState = {
  pendingTransactions: number
  transactionThroughput: number
}

export type AccountTransactionHistoryFetcherState = {
  accountFetchers: number
}

export type FetcherState<D = any> = TransactionFetcherState &
  AccountTransactionHistoryFetcherState & {
    blockchain: Blockchain
    fetcher: string
    data?: D
  }

export type TransactionState = {
  signature: string
  isCached: boolean
  isPending: boolean
  pendingAddTime?: string
  pendingExecTime?: string
  data?: RawTransaction
}

export type FetcherAccountPartitionRequestArgs = {
  account: string
  /**
   * Indexer instance id
   */
  indexerId?: string
}

// Account transaction ------------------------------

export type AddAccountTransactionRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs

export type DelAccountTransactionRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs

export type GetAccountTransactionStateRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs

// Account state ------------------------------

export type AddAccountStateRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs & {
    /**
     * Whether to subscribe to future account updates.
     */
    subscribeChanges: boolean
  }

export type DelAccountStateRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs

export type GetAccountStateStateRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs

// Transactions ------------------------------

export type FetchTransactionsBySignatureRequestArgs = BlockchainRequestArgs & {
  /**
   * Whether to refresh the transaction cache.
   */
  refreshCache?: boolean
  /**
   * Signatures to fetch.
   */
  signatures: string[]
  /**
   * Indexer instance id, the result will be delivered here
   */
  indexerId?: string
}

/**
 * Accounts and timestamp range to get the signatures for.
 */
export type FetchAccountTransactionsByDateRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs & {
    startDate: number
    endDate: number
    /**
     * Indexer instance id, the result will be delivered here
     */
    indexerId?: string
  }

// ------------------ Other ----------------------

export type FetcherStateRequestArgs = Omit<
  FetcherPartitionRequestArgs,
  'blockchainId'
> & {
  blockchainId?: Blockchain[]
}

export type CheckTransactionsRequestArgs = BlockchainRequestArgs & {
  signatures: string[]
}

export type DelTransactionsRequestArgs = BlockchainRequestArgs & {
  signatures: string[]
}

export type FetcherCommonDomainContext = {
  apiClient: FetcherMsClient
  dataPath: string
}

export type FetcherInstanceDomainContext = FetcherCommonDomainContext & {
  instanceName: string
}

export type FetcherMainDomainContext = FetcherCommonDomainContext

export interface BlockchainFetcherI<C = any> {
  start(): Promise<void>
  stop(): Promise<void>

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
  ): Promise<AccountTransactionHistoryState<C> | undefined>

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

  getFetcherState(args: FetcherStateRequestArgs): Promise<FetcherState>

  getTransactionState(
    args: CheckTransactionsRequestArgs,
  ): Promise<TransactionState[]>

  delTransactionCache(args: DelTransactionsRequestArgs): Promise<void>
}
