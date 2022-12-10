import { BlockTransactionObject } from 'web3-eth'
import { EthereumSignatureEntity } from '../../rpc/ethereum/dal.js'
import {
  BaseFetcherJobRunnerOptions,
  BaseFetcherPaginationCursors,
  BaseFetcherPaginationResponse,
} from '../base/index.js'

// Common

export type EthereumBlock = BlockTransactionObject

export type EthereumSignature = EthereumSignatureEntity

export type EthereumFetcherJobRunnerOptions<C> = Omit<
  BaseFetcherJobRunnerOptions<C>,
  'handleFetch' | 'updateCursors' | 'interval'
> & {
  interval?: number
}

// Blocks

export type EthereumBlockPaginationCursor = {
  height: number
  timestamp: number
  signature: string
}

export type EthereumBlockPaginationCursors =
  BaseFetcherPaginationCursors<EthereumBlockPaginationCursor>

export type EthereumBlockPaginationResponse = BaseFetcherPaginationResponse<
  EthereumBlock,
  EthereumBlockPaginationCursor
>

export type EthereumBlockFetcherJobRunnerOptions =
  EthereumFetcherJobRunnerOptions<EthereumBlockPaginationCursors>

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

export type EthereumSignaturePaginationCursor = {
  height: number
  timestamp: number
  signature: string
}

export type EthereumSignaturePaginationCursors =
  BaseFetcherPaginationCursors<EthereumSignaturePaginationCursor>

export type EthereumSignaturePaginationResponse = BaseFetcherPaginationResponse<
  EthereumSignature,
  EthereumSignaturePaginationCursor
>

export type EthereumSignatureFetcherJobRunnerOptions =
  EthereumFetcherJobRunnerOptions<EthereumSignaturePaginationCursors>

export type EthereumSignatureFetcherOptions = {
  account: string
  forward?: boolean | EthereumSignatureFetcherJobRunnerOptions
  backward?: boolean | EthereumSignatureFetcherJobRunnerOptions
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

export type EthereumSignatureFetcherClientI = {
  fetchSignatures(args: EthereumFetchSignaturesOptions): Promise<AsyncGenerator>
}
