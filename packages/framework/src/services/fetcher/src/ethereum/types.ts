import { EthereumAccountTransactionHistoryPaginationCursor } from '@aleph-indexer/core'
import { AccountTransactionHistoryState, FetcherState } from '../base/types.js'

export type EthereumAccountTransactionHistoryState =
  AccountTransactionHistoryState<EthereumAccountTransactionHistoryPaginationCursor> & {
    firstHeight?: number
    lastHeight?: number
    firstSignature?: string
    lastSignature?: string
  }

export type EthereumFetcherState = FetcherState<{
  firstBlock?: EthereumAccountTransactionHistoryPaginationCursor
  lastBlock?: EthereumAccountTransactionHistoryPaginationCursor
}>
