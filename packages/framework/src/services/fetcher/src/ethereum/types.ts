import { EthereumAccountSignatureHistoryPaginationCursor } from '@aleph-indexer/core'
import { AccountTransactionHistoryState } from '../base/types.js'

export type EthereumAccountTransactionHistoryState =
  AccountTransactionHistoryState<EthereumAccountSignatureHistoryPaginationCursor> & {
    firstHeight?: number
    lastHeight?: number
    firstSignature?: string
    lastSignature?: string
  }
