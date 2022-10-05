import { StorageValueStream } from '@aleph-indexer/core'
import { TransportType } from '../../../utils/index.js'
import { IndexerMsI, PrivateIndexerMsI } from '../interface.js'
import { TransactionRequestType } from './dal/transactionRequest.js'
import { TransactionParsedResponse } from './dal/transactionRequestResponse.js'

export {
  InstructionContextV1,
  ParsedTransactionV1,
  ParsedInstructionV1,
  ParsedInnerInstructionV1,
} from '@aleph-indexer/core'

/**
 * Describes a date range associated with an account.
 */
export type AccountDateRange = {
  account: string
  startDate: number
  endDate: number
}

/**
 * Describes a slot range associated with an account.
 */
export type AccountSlotRange = {
  account: string
  startSlot: number
  endSlot: number
}

/**
 * {@link AccountDateRange} bundled with fetched transactions.
 */
export type TransactionDateRangeResponse = AccountDateRange & {
  txs: StorageValueStream<TransactionParsedResponse>
}

export type AccountTransactionsIndexerArgs = {
  /**
   * Account to index.
   */
  account: string
  /**
   * How often to fetch a new chunk of transactions. (@todo: what is this helpful for?)
   */
  chunkDelay: number
  /**
   * How large the timeframe of a chunk is. (@todo: what is this helpful for?)
   */
  chunkTimeframe: number
}

export type AccountContentIndexerArgs = {
  /**
   * Account to index.
   */
  account: string
  /**
   * How often to fetch a new snapshot of the account's content. (@todo: what is this helpful for? Why not subscribe to the account's content?)
   */
  snapshotDelay: number
}

export type AccountPartitionRequestArgs = {
  /**
   * Account to partition.
   */
  account: string
  /**
   * Key of the partition group to which the account belongs.
   */
  partitionKey?: string
}

export type IndexerPartitionRequestArgs = {
  /**
   * @todo: what is this helpful for? similar to above?
   */
  indexer: string
}

export type AccountIndexerRequestArgs = AccountPartitionRequestArgs & {
  /**
   * Indexer options.
   */
  index: {
    /**
     * Whether to index transactions or arguments to the transaction indexer.
     */
    transactions: boolean | Omit<AccountTransactionsIndexerArgs, 'account'>
    /**
     * Whether to index account content or arguments to the account indexer.
     */
    content: boolean | Omit<AccountContentIndexerArgs, 'account'>
  }
}

export type AccountIndexerConfigWithMeta<T> = AccountIndexerRequestArgs & {
  meta: T
}

export type GetAccountIndexingStateRequestArgs = AccountPartitionRequestArgs

export type InvokeMethodRequestArgs = AccountPartitionRequestArgs & {
  /**
   * Method to invoke.
   */
  method: string
  /**
   * Arguments to pass to the method.
   */
  args?: unknown[]
}

export type GetTransactionPendingRequestsRequestArgs =
  IndexerPartitionRequestArgs & {
    /**
     * Whether to filter by slot, date or signature requests.
     */
    type?: TransactionRequestType
    /**
     * Optional filter by unique nonce.
     */
    nonce?: number
    /**
     * Whether to return only pending requests or only processed requests.
     * If undefined, both are returned.
     */
    complete?: boolean
    /**
     * Optional filter by associated account.
     */
    account?: string
    /**
     * Optional filter by associated signature.
     */
    signature?: string
  }

export type AccountEventsFilters = AccountDateRange

/**
 * Describes an object capable of handling transaction streams.
 */
export type TransactionIndexerHandler = {
  onTxDateRange(data: TransactionDateRangeResponse): Promise<void>
}

export type IndexerCommonDomainContext = {
  /**
   * Name of the project to which the indexer belongs.
   */
  projectId: string
  /**
   * Transport type used to communicate inside the indexer.
   */
  transport: TransportType
  /**
   * Client for calling the indexer service.
   */
  apiClient: IndexerMsI & PrivateIndexerMsI
  /**
   * Path to the directory where data is stored.
   */
  dataPath: string
}

export type IndexerDomainContext = IndexerCommonDomainContext & {
  instanceName: string
}

/**
 * Describes an indexer worker domain,
 * capable of indexing transactions and adding new accounts to be indexed.
 */
export type IndexerWorkerDomainI = TransactionIndexerHandler & {
  init(): Promise<void>
  onNewAccount(args: AccountIndexerRequestArgs): Promise<void>
}

export type IndexerMainDomainContext = IndexerCommonDomainContext

export type IndexerMainDomainI = {
  init(): Promise<void>
}

/**
 * Stats about an account indexer's state.
 */
export type AccountIndexerState = {
  /**
   * Which account is being indexed.
   */
  account: string
  /**
   * If its statistics are accurate.
   */
  accurate: boolean
  /**
   * Percentage of the account's transactions have been indexed.
   */
  progress: number
  /**
   * Which transactions are pending.
   */
  pending: string[]
  /**
   * Which transactions have been indexed.
   */
  processed: string[]
}
