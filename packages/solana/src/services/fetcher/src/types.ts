import { ConfirmedSignatureInfo } from '@solana/web3.js'
import {
  AccountStateStorage,
  AccountEntityHistoryState,
  BaseFetcherJobRunnerOptions,
  BaseFetcherPaginationResponse,
  BlockchainRequestArgs,
  FetcherAccountPartitionRequestArgs,
} from '@aleph-indexer/framework'
import { SolanaErrorFetching } from '../../../sdk/index.js'

export type SolanaAccountTransactionHistoryPaginationCursor = {
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
  accounts: string[]
}

// --------------------------

export type SolanaTransactionHistoryFetcherJobRunnerOptions = Omit<
  BaseFetcherJobRunnerOptions<SolanaAccountTransactionHistoryPaginationCursor>,
  'handleFetch' | 'updateCursor' | 'interval'
> & {
  interval?: number
  iterationFetchLimit?: number
}

export type SolanaTransactionHistoryFetcherForwardJobRunnerOptions =
  SolanaTransactionHistoryFetcherJobRunnerOptions & {
    ratio?: number
    ratioThreshold?: number
  }

export type SolanaTransactionHistoryFetcherBackwardJobRunnerOptions =
  SolanaTransactionHistoryFetcherJobRunnerOptions & {
    fetchUntil?: string
  }

export type SolanaTransactionHistoryFetcherOptions = {
  address: string
  forward?: boolean | SolanaTransactionHistoryFetcherForwardJobRunnerOptions
  backward?: boolean | SolanaTransactionHistoryFetcherBackwardJobRunnerOptions
  errorFetching?: SolanaErrorFetching
  indexSignatures(
    signatures: SolanaSignature[],
    goingForward: boolean,
  ): Promise<void>
}

export type SolanaTransactionHistoryPaginationResponse =
  BaseFetcherPaginationResponse<
    SolanaSignatureInfo,
    SolanaAccountTransactionHistoryPaginationCursor
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

// -------------------------------------------------------------------

export type SolanaAccountEntityHistoryState =
  AccountEntityHistoryState<SolanaAccountTransactionHistoryPaginationCursor> & {
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
