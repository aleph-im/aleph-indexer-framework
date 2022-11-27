import { RawTransactionV1 } from '@aleph-indexer/core'
import { FetcherMsI, PrivateFetcherMsI } from '../interface.js'
import {DateTime} from "luxon";

export type SignatureFetcherState = {
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

export type FetcherAccountPartitionRequestArgs = {
  account: string
  /**
   * Indexer instance id
   */
  indexerId?: string
}

export type AddAccountInfoFetcherRequestArgs =
  FetcherAccountPartitionRequestArgs & {
    /**
     * Whether to subscribe to future account updates.
     */
    subscribeChanges: boolean
  }

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

/**
 * Enumerates the possible requests that can be made to the fetcher service.
 */
export enum FetcherOptionsTypes {
  AccountFetcher = 'account_fetcher',
  AccountInfoFetcher = 'account_info_fetcher',
  TransactionSignatureFetcher = 'transaction_signature_fetcher',
  AccountTransactionDateFetcher = 'account_transaction_date_fetcher',
  AccountTransactionSlotFetcher = 'account_transaction_slot_fetcher',
}

export type BaseFetcherRequest = {
  id: string
  type: string
}

export type FetcherAccountRequest = Omit<BaseFetcherRequest, 'type'> & {
  type: FetcherOptionsTypes.AccountFetcher
  options: {
    account: string
  }
}

export type FetcherAccountInfoRequest = Omit<BaseFetcherRequest, 'type'> & {
  type: FetcherOptionsTypes.AccountInfoFetcher
  options: {
    account: string
    subscribeChanges: boolean
  }
}

export type FetcherSignatureRequest = Omit<BaseFetcherRequest, 'type'> & {
  type: FetcherOptionsTypes.TransactionSignatureFetcher
  options: {
    account: string
    signatures: string[]
    indexerId: string
  }
}

export type FetcherDateRequest = Omit<BaseFetcherRequest, 'type'> & {
  type: FetcherOptionsTypes.AccountTransactionDateFetcher
  options: {
    account: string
    startDate: number
    endDate: number
    indexerId: string
  }
}

export type FetcherSlotRequest = Omit<BaseFetcherRequest, 'type'> & {
  type: FetcherOptionsTypes.AccountTransactionSlotFetcher
  options: {
    account: string
    startSlot: number
    endSlot: number
    indexerId: string
  }
}

export type FetcherRequest =
  | FetcherAccountRequest
  | FetcherAccountInfoRequest
  | FetcherSignatureRequest
  | FetcherDateRequest
  | FetcherSlotRequest
