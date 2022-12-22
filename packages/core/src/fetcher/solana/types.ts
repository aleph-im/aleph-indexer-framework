import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { SolanaErrorFetching } from '../../rpc/index.js'
import {
  AccountStateStorage,
  BaseFetcherJobRunnerOptions,
  BaseFetcherPaginationResponse,
} from '../base/index.js'

export type SolanaAccountSignatureHistoryPaginationCursor = {
  signature?: string
  slot?: number
  timestamp?: number
}

export type SolanaSignatureInfo = ConfirmedSignatureInfo

export type SolanaSignature = Omit<
  ConfirmedSignatureInfo,
  'memo' | 'confirmationStatus'
> & {
  accountSlotIndex: Record<string, number>
}

// --------------------------

export type SolanaSignatureFetcherJobRunnerOptions = Omit<
  BaseFetcherJobRunnerOptions<SolanaAccountSignatureHistoryPaginationCursor>,
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
  indexSignatures(
    signatures: SolanaSignature[],
    goingForward: boolean,
  ): Promise<void>
}

export type SolanaSignaturePaginationResponse = BaseFetcherPaginationResponse<
  SolanaSignatureInfo,
  SolanaAccountSignatureHistoryPaginationCursor
>

// Account State

export type SolanaAccountStateFetcherOptions = {
  account: string
  subscribeChanges?: boolean
}

export type SolanaAccountState = {
  account: string
  executable: boolean
  owner: string
  lamports: number
  data: any
  rentEpoch?: number
}

export type SolanaAccountStateStorage = AccountStateStorage<SolanaAccountState>
