import { BlockchainRequestArgs } from '../types.js'
import { TransactionRequest } from './src/base/dal/transactionRequest.js'
import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  InvokeMethodRequestArgs,
  GetAccountIndexingStateRequestArgs,
  GetTransactionPendingRequestsRequestArgs,
} from './src/base/types.js'

/**
 * Provides outward-facing methods of the indexer.
 */
export interface IndexerMsI {
  /**
   * Registers a new indexer for the given account, either for transactions or content or both.
   * @param args The indexer configuration.
   */
  indexAccount(args: AccountIndexerRequestArgs): Promise<void>
  /**
   * Returns the indexing state of the given account.
   * @param args The account to get the state of.
   */
  getAccountState(
    args: GetAccountIndexingStateRequestArgs,
  ): Promise<AccountIndexerState | undefined>
  /**
   * Invokes a domain method with the given account.
   * This will be forwarded through the broker to the worker. @todo: Correct?
   * @param args The account, the method and additional arguments to pass to the method.
   */
  invokeDomainMethod(args: InvokeMethodRequestArgs): Promise<unknown>

  /**
   * Remove the indexer for the given account, either for transactions or content or both.
   * @param args The indexer configuration.
   */
  deleteAccount(args: AccountIndexerRequestArgs): Promise<void>

  /**
   * Returns all pending and processed transaction requests.
   * @param args
   */
  getTransactionRequests(
    args: GetTransactionPendingRequestsRequestArgs,
  ): Promise<TransactionRequest[]>

  /**
   * Returns all indexer IDs.
   */
  getAllIndexers(): string[]
}

export interface IndexerClientI {
  indexAccount(
    args: Omit<AccountIndexerRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void>
  getAccountState(
    args: Omit<GetAccountIndexingStateRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<AccountIndexerState | undefined>
  invokeDomainMethod(
    args: Omit<InvokeMethodRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<unknown>
  deleteAccount(
    args: Omit<AccountIndexerRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void>
  getTransactionRequests(
    args: Omit<
      GetTransactionPendingRequestsRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<TransactionRequest[]>
}
