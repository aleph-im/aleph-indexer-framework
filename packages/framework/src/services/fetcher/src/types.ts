import { Blockchain, RawTransactionV1 } from '@aleph-indexer/core'
import { FetcherMsI, PrivateFetcherMsI } from '../interface.js'

export type SolanaSignatureFetcherState = {
  fetcher: string
  account: string
  firstTimestamp?: number
  lastTimestamp?: number
  firstSlot?: number
  lastSlot?: number
  firstSignature?: string
  lastSignature?: string
  completeHistory: boolean
}

export type FetcherPartitionRequestArgs = {
  fetcher: string
}

export type FetcherState = {
  fetcher: string
  pendingTransactions: number
  accountFetchers: number
  transactionThroughput: number
}

export type TransactionState = {
  fetcher: string
  signature: string
  isCached: boolean
  isPending: boolean
  pendingAddTime?: string
  pendingExecTime?: string
  data?: RawTransactionV1
}

export type FetcherCommonRequestArgs = {
  blockchainId: Blockchain
}

export type FetcherAccountPartitionRequestArgs = {
  account: string
  /**
   * Indexer instance id
   */
  indexerId?: string
}

export type AddAccountFetcherRequestArgs = FetcherCommonRequestArgs &
  FetcherAccountPartitionRequestArgs

export type GetAccountFetcherStateRequestArgs = FetcherCommonRequestArgs &
  FetcherAccountPartitionRequestArgs

export type DelAccountFetcherRequestArgs = FetcherCommonRequestArgs &
  FetcherAccountPartitionRequestArgs

/**
 * Accounts and timestamp range to get the signatures for.
 */
export type FetchAccountTransactionsByDateRequestArgs =
  FetcherAccountPartitionRequestArgs & {
    startDate: number
    endDate: number
    /**
     * Indexer instance id, the result will be delivered here
     */
    indexerId?: string
  }

// ------------------ Solana specific methods ----------------------

export type AddAccountInfoFetcherRequestArgs =
  FetcherAccountPartitionRequestArgs & {
    /**
     * Whether to subscribe to future account updates.
     */
    subscribeChanges: boolean
  }

/**
 * Account and slot range to get the signatures for.
 */
export type FetchAccountTransactionsBySlotRequestArgs =
  FetcherAccountPartitionRequestArgs & {
    startSlot: number
    endSlot: number
    /**
     * Indexer instance id, the result will be delivered here
     */
    indexerId?: string
  }

export type FetchTransactionsBySignatureRequestArgs = {
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

export type FetcherStateRequestArgs = FetcherPartitionRequestArgs

export type CheckTransactionsRequestArgs = {
  signatures: string[]
}

export type DelTransactionsRequestArgs = {
  signatures: string[]
}

export type FetcherCommonDomainContext = {
  apiClient: FetcherMsI & PrivateFetcherMsI
  dataPath: string
}

export type FetcherInstanceDomainContext = FetcherCommonDomainContext & {
  instanceName: string
}

export type FetcherMainDomainContext = FetcherCommonDomainContext
