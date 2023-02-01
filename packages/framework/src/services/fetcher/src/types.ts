import { Utils } from '@aleph-indexer/core'
import { Blockchain, IndexableEntityType, RawEntity } from '../../../types.js'
import { BlockchainRequestArgs } from '../../types.js'
import { FetcherMsClient } from '../client.js'

// ---------------------- Pagination --------------------------

export interface BaseFetcherPaginationCursors<C> {
  backward?: C
  forward?: C
}

export type BaseFetcherPaginationResponse<D, C> = {
  cursors: BaseFetcherPaginationCursors<C>
  chunk: D[]
}

// ------------------------ Options ---------------------

export type FetcherJobRunnerHandleFetchResult<C> = {
  error?: Error
  newInterval?: number
  lastCursors: BaseFetcherPaginationCursors<C>
}

export type FetcherJobRunnerUpdateCursorResult<C> = {
  newItems: boolean
  newCursors: BaseFetcherPaginationCursors<C>
}

export type BaseFetcherJobRunnerOptions<C> = Omit<
  Utils.JobRunnerOptions,
  'name' | 'intervalFn'
> & {
  handleFetch: (ctx: {
    firstRun: boolean
    interval: number
  }) => Promise<FetcherJobRunnerHandleFetchResult<C>>
  updateCursors?: (ctx: {
    prevCursors?: BaseFetcherPaginationCursors<C>
    lastCursors: BaseFetcherPaginationCursors<C>
  }) => Promise<FetcherJobRunnerUpdateCursorResult<C>>
  checkComplete?: (ctx: {
    fetcherState: BaseFetcherState<C>
    jobState: BaseFetcherJobState
    newItems: boolean
    error?: Error
  }) => Promise<boolean>
}

export interface BaseFetcherOptions<C> {
  id: string
  jobs?: {
    forward?: BaseFetcherJobRunnerOptions<C>
    backward?: BaseFetcherJobRunnerOptions<C>
  }
}

// ---------------------- State --------------------------

export type BaseFetcherJobState = {
  frequency?: number
  lastRun: number
  numRuns: number
  complete: boolean
  useHistoricRPC: boolean
}

export type BaseFetcherJobStates = {
  forward: BaseFetcherJobState
  backward: BaseFetcherJobState
}

export type BaseFetcherState<C> = {
  id: string
  jobs: BaseFetcherJobStates
  cursors?: BaseFetcherPaginationCursors<C>
}

// ---------------------------------------------------------

export type AccountEntityHistoryState<C> = {
  fetcher: string
  type: IndexableEntityType
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

export type EntityFetcherState = {
  pendingEntities: number
  entitiesThroughput: number
}

export type AccountEntityHistoryFetcherState = {
  accountFetchers: number
}

export type AccountEntityFetcherMainState = EntityFetcherState &
  AccountEntityHistoryFetcherState & {
    type: IndexableEntityType
  }

export type FetcherState<T = any> = (AccountEntityFetcherMainState & {
  blockchain: Blockchain
  fetcher: string
  type: IndexableEntityType
  data?: T
})[]

export type EntityState = {
  id: string
  isCached: boolean
  isPending: boolean
  pendingAddTime?: string
  pendingExecTime?: string
  data?: RawEntity
}

export type IndexerIdRequestArgs = {
  /**
   * Indexer instance id
   */
  indexerId?: string
}

export type FetcherAccountPartitionRequestArgs = IndexerIdRequestArgs & {
  account: string
}

export type FetcherAccountEntityTypeRequestArgs = {
  type: IndexableEntityType
}

// Account transaction ------------------------------

export type AddAccountEntityRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs &
  FetcherAccountEntityTypeRequestArgs

export type DelAccountEntityRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs &
  FetcherAccountEntityTypeRequestArgs

export type GetAccountEntityStateRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs &
  FetcherAccountEntityTypeRequestArgs

// Account state ------------------------------

/**
 * Accounts and timestamp range to get the ids for.
 */
export type FetchAccountEntitiesByDateRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs &
  FetcherAccountEntityTypeRequestArgs & {
    startDate: number
    endDate: number
    /**
     * Metadata for extending functionality if needed
     */
    meta?: any
  }

export type FetchEntitiesByIdRequestArgs = BlockchainRequestArgs &
  IndexerIdRequestArgs &
  FetcherAccountEntityTypeRequestArgs & {
    /**
     * Whether to refresh the transaction cache.
     */
    refreshCache?: boolean
    /**
     * Signatures to fetch.
     */
    ids: string[]
    /**
     * Metadata for extending functionality if needed
     */
    meta?: any
  }

// ------------------ Other ----------------------

export type FetcherStateRequestArgs = Omit<
  FetcherPartitionRequestArgs,
  'blockchainId'
> & {
  blockchainId?: Blockchain[]
  type?: IndexableEntityType[]
}

export type CheckEntityRequestArgs = BlockchainRequestArgs &
  FetcherAccountEntityTypeRequestArgs & {
    ids: string[]
  }

export type DelEntityRequestArgs = BlockchainRequestArgs &
  FetcherAccountEntityTypeRequestArgs & {
    ids: string[]
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
   * Requests a new signature fetcher, which will fetch all txn ids including a given account.
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
  ): Promise<AccountEntityHistoryState<C> | undefined>

  /**
   * Returns all txn ids fetched for a given account by timestamp range as a stream.
   * @param args Account and timestamp range to get the ids for.
   */
  fetchAccountEntitiesByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>>

  /**
   * Adds new ids to the fetcher loop to fetch their related transactions.
   * @param args The ids of the transactions to fetch.
   */
  fetchEntitiesById(args: FetchEntitiesByIdRequestArgs): Promise<void>

  getFetcherState(args: FetcherStateRequestArgs): Promise<FetcherState>

  getEntityState(args: CheckEntityRequestArgs): Promise<EntityState[]>

  delEntityCache(args: DelEntityRequestArgs): Promise<void>
}
