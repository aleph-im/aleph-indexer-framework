// Common

import {
  AccountStateStorage,
  AccountEntityHistoryState,
  BaseFetcherJobRunnerOptions,
  BaseFetcherPaginationCursors,
  BaseFetcherPaginationResponse,
  FetcherState,
} from '@aleph-indexer/framework'
import {
  EthereumRawBlock,
  EthereumRawLog,
  EthereumAccountTransactionHistoryStorageEntity,
} from '../../../types.js'

export type EthereumFetcherJobRunnerOptions<C> = Omit<
  BaseFetcherJobRunnerOptions<C>,
  'handleFetch' | 'updateCursors' | 'interval'
> & {
  interval?: number
  iterationFetchLimit?: number
}

// Blocks

export type EthereumBlockHistoryPaginationCursor = {
  height: number
  timestamp: number
  signature: string
}

export type EthereumBlockHistoryPaginationCursors =
  BaseFetcherPaginationCursors<EthereumBlockHistoryPaginationCursor>

export type EthereumBlockPaginationResponse = BaseFetcherPaginationResponse<
  EthereumRawBlock,
  EthereumBlockHistoryPaginationCursor
>

export type EthereumFetchBlocksOptions = {
  before?: number
  until?: number
  iterationLimit?: number
  pageLimit?: number
}

// Transaction Signatures

export type EthereumAccountTransactionHistoryPaginationCursor = {
  height: number
  timestamp: number
  signature: string
}

export type EthereumTransactionHistoryPaginationCursors =
  BaseFetcherPaginationCursors<EthereumAccountTransactionHistoryPaginationCursor>

export type EthereumTransactionHistoryPaginationResponse =
  BaseFetcherPaginationResponse<
    EthereumAccountTransactionHistoryStorageEntity,
    EthereumAccountTransactionHistoryPaginationCursor
  >

export type EthereumFetchSignaturesOptions = {
  account: string
  before?: number
  until?: number
  iterationLimit?: number
  pageLimit?: number
}

export type EthereumAccountTransactionHistoryState =
  AccountEntityHistoryState<EthereumAccountTransactionHistoryPaginationCursor> & {
    firstHeight?: number
    lastHeight?: number
    firstSignature?: string
    lastSignature?: string
  }

// Logs

export type EthereumAccountLogHistoryPaginationCursor = {
  height: number
  timestamp: number
}

export type EthereumLogHistoryPaginationCursors =
  BaseFetcherPaginationCursors<EthereumAccountLogHistoryPaginationCursor>

export type EthereumLogHistoryPaginationResponse =
  BaseFetcherPaginationResponse<
    EthereumRawLog,
    EthereumAccountLogHistoryPaginationCursor
  >

export type EthereumLogHistoryFetcherJobRunnerOptions =
  EthereumFetcherJobRunnerOptions<EthereumLogHistoryPaginationCursors>

export type EthereumFetchLogsOptions = {
  account: string
  before?: number
  until?: number
  iterationLimit?: number
  pageLimit?: number
  isContractAccount?: boolean
}

export type EthereumAccountLogHistoryState =
  AccountEntityHistoryState<EthereumAccountLogHistoryPaginationCursor> & {
    firstHeight?: number
    lastHeight?: number
  }

// Account State

export type EthereumAccountStateFetcherOptions = {
  account: string
  subscribeChanges?: boolean
}

export type EthereumAccountState = {
  account: string
  balance: string
}

export type EthereumAccountStateStorage =
  AccountStateStorage<EthereumAccountState>

export type EthereumFetcherState = FetcherState<{
  firstBlock?: EthereumAccountTransactionHistoryPaginationCursor
  lastBlock?: EthereumAccountTransactionHistoryPaginationCursor
}>
