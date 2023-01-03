import { EthereumBlock, EthereumSignature } from '../../types/ethereum.js'
import {
  AccountStateStorage,
  BaseFetcherJobRunnerOptions,
  BaseFetcherPaginationCursors,
  BaseFetcherPaginationResponse,
} from '../base/index.js'

// Common

export type EthereumFetcherJobRunnerOptions<C> = Omit<
  BaseFetcherJobRunnerOptions<C>,
  'handleFetch' | 'updateCursors' | 'interval'
> & {
  interval?: number
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
  EthereumBlock,
  EthereumBlockHistoryPaginationCursor
>

export type EthereumBlockFetcherJobRunnerOptions =
  EthereumFetcherJobRunnerOptions<EthereumBlockHistoryPaginationCursors>

export type EthereumBlockFetcherOptions = {
  forward?: boolean | EthereumBlockFetcherJobRunnerOptions
  backward?: boolean | EthereumBlockFetcherJobRunnerOptions
  indexBlocks(blocks: EthereumBlock[], goingForward: boolean): Promise<void>
}

export type EthereumFetchBlocksOptions = {
  before?: number
  until?: number
  maxLimit?: number
}

export type EthereumBlockFetcherClientI = {
  fetchBlocks(
    args: EthereumFetchBlocksOptions,
  ): Promise<AsyncGenerator<EthereumBlockPaginationResponse>>
}

// Signatures

export type EthereumAccountTransactionHistoryPaginationCursor = {
  height: number
  timestamp: number
  signature: string
}

export type EthereumTransactionHistoryPaginationCursors =
  BaseFetcherPaginationCursors<EthereumAccountTransactionHistoryPaginationCursor>

export type EthereumTransactionHistoryPaginationResponse =
  BaseFetcherPaginationResponse<
    EthereumSignature,
    EthereumAccountTransactionHistoryPaginationCursor
  >

export type EthereumTransactionHistoryFetcherJobRunnerOptions =
  EthereumFetcherJobRunnerOptions<EthereumTransactionHistoryPaginationCursors>

export type EthereumTransactionHistoryFetcherOptions = {
  account: string
  forward?: boolean | EthereumTransactionHistoryFetcherJobRunnerOptions
  backward?: boolean | EthereumTransactionHistoryFetcherJobRunnerOptions
  indexSignatures(
    blocks: EthereumSignature[],
    goingForward: boolean,
  ): Promise<void>
}

export type EthereumFetchSignaturesOptions = {
  account: string
  before?: number
  until?: number
  maxLimit?: number
}

export type EthereumTransactionHistoryFetcherClientI = {
  fetchSignatures(args: EthereumFetchSignaturesOptions): Promise<AsyncGenerator>
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
