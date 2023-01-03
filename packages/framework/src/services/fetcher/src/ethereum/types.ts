import { EthereumAccountTransactionHistoryPaginationCursor } from '@aleph-indexer/core'
import { AccountTransactionHistoryState } from '../base/types.js'

export type EthereumAccountTransactionHistoryState =
  AccountTransactionHistoryState<EthereumAccountTransactionHistoryPaginationCursor> & {
    firstHeight?: number
    lastHeight?: number
    firstSignature?: string
    lastSignature?: string
  }
