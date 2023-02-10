import { StorageValueStream } from '@aleph-indexer/core'
import {
  Blockchain,
  IndexableEntityType,
  ParsedEntity,
} from '../../../types.js'
import { TransportType } from '../../../utils/index.js'
import { BlockchainRequestArgs } from '../../types.js'
import { IndexerMsClient } from '../client.js'
import { EntityRequest, EntityRequestType } from './dal/entityRequest.js'

/**
 * Describes a date range associated with an account.
 */
export type IdRange = {
  blockchainId: Blockchain
  ids: string[]
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
export type EntityDateRangeResponse<T extends ParsedEntity<unknown>> =
  AccountDateRange & {
    type: IndexableEntityType
    entities: StorageValueStream<T>
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

export type AccountIndexerEntityRequestArgs = BlockchainRequestArgs &
  IndexerAccountPartitionRequestArgs & {
    /**
     * The kind of entity to index
     */
    type: IndexableEntityType
    /**
     * How often to fetch a new chunk of transactions. (@todo: what is this helpful for?)
     */
    chunkDelay: number
    /**
     * How large the timeframe of a chunk is. (@todo: what is this helpful for?)
     */
    chunkTimeframe: number
  }

export type AccountIndexerTransactionRequestArgs =
  AccountIndexerEntityRequestArgs
export type AccountIndexerLogRequestArgs = AccountIndexerEntityRequestArgs
export type AccountIndexerStateRequestArgs = AccountIndexerEntityRequestArgs

export type AccountIndexerRequestArgs = BlockchainRequestArgs &
  IndexerAccountPartitionRequestArgs & {
    /**
     * Indexer options.
     */
    index: {
      /**
       * Whether to index account transactions.
       */
      transactions?:
        | boolean
        | Omit<
            AccountIndexerTransactionRequestArgs,
            'type' | 'account' | 'blockchainId'
          >
      /**
       * Whether to index account logs.
       */
      logs?:
        | boolean
        | Omit<
            AccountIndexerLogRequestArgs,
            'type' | 'account' | 'blockchainId'
          >
      /**
       * Whether to index account state.
       */
      state?:
        | boolean
        | Omit<
            AccountIndexerStateRequestArgs,
            'type' | 'account' | 'blockchainId'
          >
    }
  }

export type DelAccountIndexerRequestArgs = BlockchainRequestArgs &
  IndexerAccountPartitionRequestArgs & {
    index: {
      /**
       * Whether to stop indexing account transactions
       */
      transactions?: boolean
      /**
       * Whether to stop indexing account logs
       */
      logs?: boolean

      /**
       * Whether to stop indexing account state
       */
      state?: boolean
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

export type GetAccountIndexingEntityStateRequestArgs = BlockchainRequestArgs &
  IndexerAccountPartitionRequestArgs & {
    type: IndexableEntityType
  }

export type InvokeMethodRequestArgs = Partial<BlockchainRequestArgs> &
  IndexerAccountPartitionRequestArgs & {
    /**
     * Method to invoke.
     */
    method: string
    /**
     * Arguments to pass to the method.
     */
    args?: unknown[]
    /**
     * Indexer to execute.
     */
    indexer?: string
  }

export type GetEntityPendingRequestsRequestArgs = BlockchainRequestArgs &
  IndexerIndexerPartitionRequestArgs & {
    type: IndexableEntityType
    /**
     * Whether to filter by slot, date or signature requests.
     */
    requestType?: EntityRequestType
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
     * Optional filter by associated id.
     */
    id?: string
  }

export type AccountEventsFilters = AccountDateRange

/**
 * Describes an object capable of handling transaction streams.
 */
export type EntityIndexerHandler<T extends ParsedEntity<unknown>> = {
  onEntityDateRange(data: EntityDateRangeResponse<T>): Promise<void>
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
export type IndexerWorkerDomainI = EntityIndexerHandler<
  ParsedEntity<unknown>
> & {
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
export type AccountEntityIndexerState = {
  indexer: string
  type: IndexableEntityType
  blockchain: Blockchain

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

/**
 * Stats about an account indexer's state.
 */
export type AccountIndexerState = AccountEntityIndexerState & {
  blockchain: Blockchain
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
   * Remove the indexer for the given account, either for transactions or content or both.
   * @param config The indexer configuration.
   */
  deleteAccount(config: AccountIndexerRequestArgs): Promise<void>

  /**
   * Returns the indexing state of the given account.
   * @param args The account to get the state of.
   */
  getAccountState(
    args: GetAccountIndexingEntityStateRequestArgs,
  ): Promise<AccountIndexerState | undefined>

  /**
   * Returns all pending and processed transaction requests.
   * @param args
   */
  getEntityPendingRequests(
    args: GetEntityPendingRequestsRequestArgs,
  ): Promise<EntityRequest[]>
}
