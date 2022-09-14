import { TransactionRequest } from './src/dal/transactionRequest.js'
import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  InvokeMethodRequestArgs,
  GetAccountIndexingStateRequestArgs,
  GetTransactionPendingRequestsRequestArgs,
} from './src/types.js'

/**
 * Provides outward-facing methods of the indexer.
 */
export interface IndexerMsI {
  /**
   * Registers a new indexer for the given account, either for transactions or content or both.
   * @param config The indexer configuration.
   */
  indexAccount(config: AccountIndexerRequestArgs): Promise<void>
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
}

/**
 * Provides inward-facing methods of the indexer.
 */
export interface PrivateIndexerMsI {
  /**
   * Returns all indexer IDs.
   */
  getAllIndexers(): string[]

  /**
   * Returns all pending and processed transaction requests.
   * @param args
   */
  getTransactionRequests(
    args: GetTransactionPendingRequestsRequestArgs,
  ): Promise<TransactionRequest[]>
  /**
   * Called when new transactions are available. A hook for the (instruction) parser service.
   * @param chunk The fetched and basic parsed transactions.
   */
  // onTxs(chunk: ParsedTransactionV1[]): Promise<void>
}
