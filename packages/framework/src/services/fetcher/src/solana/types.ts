import { SolanaAccountTransactionHistoryPaginationCursor } from '@aleph-indexer/core'
import {
  AccountTransactionHistoryState,
  FetcherAccountPartitionRequestArgs,
  FetcherCommonRequestArgs,
} from '../base/types'

export type SolanaAccountTransactionHistoryState =
  AccountTransactionHistoryState<SolanaAccountTransactionHistoryPaginationCursor> & {
    firstSlot?: number
    lastSlot?: number
  }

export type AddAccountStateRequestArgs = FetcherCommonRequestArgs &
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
  FetcherCommonRequestArgs &
    FetcherAccountPartitionRequestArgs & {
      startSlot: number
      endSlot: number
      /**
       * Indexer instance id, the result will be delivered here
       */
      indexerId?: string
    }
