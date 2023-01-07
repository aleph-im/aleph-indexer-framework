import { SolanaAccountTransactionHistoryPaginationCursor } from '@aleph-indexer/core'
import { BlockchainRequestArgs } from '../../../types'
import {
  AccountTransactionHistoryState,
  FetcherAccountPartitionRequestArgs,
} from '../base/types'

export type SolanaAccountTransactionHistoryState =
  AccountTransactionHistoryState<SolanaAccountTransactionHistoryPaginationCursor> & {
    firstSlot?: number
    lastSlot?: number
  }

export type AddAccountStateRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs & {
    /**
     * Whether to subscribe to future account updates.
     */
    subscribeChanges: boolean
  }

/**
 * Account and slot range to get the signatures for.
 */
export type FetchAccountTransactionsBySlotRequestArgs = BlockchainRequestArgs &
  FetcherAccountPartitionRequestArgs & {
    startSlot: number
    endSlot: number
    /**
     * Indexer instance id, the result will be delivered here
     */
    indexerId?: string
  }
