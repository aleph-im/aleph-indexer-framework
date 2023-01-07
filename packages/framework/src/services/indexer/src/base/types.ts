import { Blockchain, StorageValueStream } from '@aleph-indexer/core'
import { TransportType } from '../../../../utils/index.js'
import { BlockchainRequestArgs } from '../../../types.js'
import { IndexerMsClient } from '../../client.js'
import {
  TransactionRequest,
  TransactionRequestType,
} from './dal/transactionRequest.js'
import { TransactionParsedResponse } from './dal/transactionRequestResponse.js'

export {
  SolanaInstructionContextV1,
  SolanaParsedTransactionV1 as ParsedTransactionV1,
  SolanaParsedInstructionV1 as ParsedInstructionV1,
  SolanaParsedInnerInstructionV1 as ParsedInnerInstructionV1,
} from '@aleph-indexer/core'

/**
 * Describes a date range associated with an account.
 */
export type SignatureRange = {
  blockchainId: Blockchain
  signatures: string[]
}

/**
 * Describes a date range associated with an account.
 */
export type AccountDateRange = {
  blockchainId: Blockchain
  account: string
  startDate: number
  endDate: number
}

/**
 * Describes a slot range associated with an account.
 */
export type AccountSlotRange = {
  blockchainId: Blockchain
  account: string
  startSlot: number
  endSlot: number
}

/**
 * {@link AccountDateRange} bundled with fetched transactions.
 */
export type TransactionDateRangeResponse = AccountDateRange & {
  blockchainId: Blockchain
  txs: StorageValueStream<TransactionParsedResponse>
}

export type IndexerAccountPartitionRequestArgs = {
  /**
   * Account to partition.
   */
  account: string
  /**
   * Key of the partition group to which the account belongs.
   */
  partitionKey?: string
}

export type IndexerIndexerPartitionRequestArgs = {
  /**
   * @todo: what is this helpful for? similar to above?
   */
  indexer: string
}

// Account  ------------------------------

export type AccountIndexerTransactionRequestArgs = BlockchainRequestArgs &
  IndexerAccountPartitionRequestArgs & {
    /**
     * How often to fetch a new chunk of transactions. (@todo: what is this helpful for?)
     */
    chunkDelay: number
    /**
     * How large the timeframe of a chunk is. (@todo: what is this helpful for?)
     */
    chunkTimeframe: number
  }

export type AccountIndexerStateRequestArgs = BlockchainRequestArgs &
  IndexerAccountPartitionRequestArgs & {
    /**
     * How often to fetch a new snapshot of the account's content. (@todo: what is this helpful for? Why not subscribe to the account's content?)
     */
    snapshotDelay: number
  }

export type AccountIndexerRequestArgs = BlockchainRequestArgs &
  IndexerAccountPartitionRequestArgs & {
    /**
     * Indexer options.
     */
    index: {
      /**
       * Whether to index transactions or arguments to the transaction indexer.
       */
      transactions:
        | boolean
        | Omit<AccountIndexerTransactionRequestArgs, 'account' | 'blockchainId'>
      /**
       * Whether to index account content or arguments to the account indexer.
       */
      content?:
        | boolean
        | Omit<AccountIndexerStateRequestArgs, 'account' | 'blockchainId'>
    }
  }

// Other --------------------------------------------------

/**
 * Indexer configuration with account information.
 */
export type AccountIndexerConfigWithMeta<T> = AccountIndexerRequestArgs & {
  /**
   * Account parsed information.
   */
  meta: T
}

export type GetAccountIndexingStateRequestArgs = BlockchainRequestArgs &
  IndexerAccountPartitionRequestArgs

export type InvokeMethodRequestArgs = BlockchainRequestArgs &
  IndexerAccountPartitionRequestArgs & {
    /**
     * Method to invoke.
     */
    method: string
    /**
     * Arguments to pass to the method.
     */
    args?: unknown[]
  }

export type GetTransactionPendingRequestsRequestArgs = BlockchainRequestArgs &
  IndexerIndexerPartitionRequestArgs & {
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
   * Supported blockchains
   */
  supportedBlockchains: Blockchain[]
  /**
   * Transport type used to communicate inside the indexer.
   */
  transport: TransportType
  /**
   * Client for calling the indexer service.
   */
  apiClient: IndexerMsClient
  // apiClient: IndexerMsI & PrivateIndexerMsI
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

export interface BlockchainIndexerI {
  start(): Promise<void>
  stop(): Promise<void>

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

  /**
   * Remove the indexer for the given account, either for transactions or content or both.
   * @param config The indexer configuration.
   */
  deleteAccount(config: AccountIndexerRequestArgs): Promise<void>

  /**
   * Returns all pending and processed transaction requests.
   * @param args
   */
  getTransactionRequests(
    args: GetTransactionPendingRequestsRequestArgs,
  ): Promise<TransactionRequest[]>
}
