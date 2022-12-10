import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { SolanaErrorFetching } from '../../rpc/index.js'
import {
  BaseFetcherJobRunnerOptions,
  BaseFetcherPaginationResponse,
} from '../base/index.js'

export type SolanaSignaturePaginationCursor = {
  signature?: string
  slot?: number
  timestamp?: number
}

export type SolanaSignature = ConfirmedSignatureInfo

export type Signature = Omit<
  ConfirmedSignatureInfo,
  'memo' | 'confirmationStatus'
> & {
  accountSlotIndex: Record<string, number>
}

// --------------------------

export type SolanaSignatureFetcherJobRunnerOptions = Omit<
  BaseFetcherJobRunnerOptions<SolanaSignaturePaginationCursor>,
  'handleFetch' | 'updateCursor' | 'interval'
> & {
  interval?: number
  iterationFetchLimit?: number
}

export type SolanaSignatureFetcherForwardJobRunnerOptions =
  SolanaSignatureFetcherJobRunnerOptions & {
    ratio?: number
    ratioThreshold?: number
  }

export type SolanaSignatureFetcherBackwardJobRunnerOptions =
  SolanaSignatureFetcherJobRunnerOptions & {
    fetchUntil?: string
  }

export type SolanaSignatureFetcherOptions = {
  address: string
  forward?: boolean | SolanaSignatureFetcherForwardJobRunnerOptions
  backward?: boolean | SolanaSignatureFetcherBackwardJobRunnerOptions
  errorFetching?: SolanaErrorFetching
  indexSignatures(signatures: Signature[], goingForward: boolean): Promise<void>
}

/**
 * Options where the account address is stored and if it needs to be updated
 * by fetching new transactions.
 */
export type AccountInfoFetcherOptions = {
  address: string
  subscribeChanges?: boolean
}

export type AccountInfo = {
  address: string
  executable: boolean
  owner: string
  lamports: number
  data: any
  rentEpoch?: number
}

export type SolanaSignaturePaginationResponse = BaseFetcherPaginationResponse<
  SolanaSignature,
  SolanaSignaturePaginationCursor
>
