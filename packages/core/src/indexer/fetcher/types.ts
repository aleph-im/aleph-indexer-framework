import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { ErrorFetching } from '../../solana.js'
import {
  AlephParsedInnerInstruction,
  AlephParsedInstruction,
  AlephParsedTransaction,
  ParsedInnerInstructionV1,
  ParsedInstructionV1,
  ParsedTransactionV1,
} from '../../types.js'
import { JobRunnerOptions } from '../../utils/index.js'

export type FetcherJobRunnerOptions = Omit<
  JobRunnerOptions,
  'name' | 'intervalFn'
> & {
  intervalFn: (ctx: { firstRun: boolean; interval: number }) => Promise<{
    error?: Error
    newInterval: number
    lastFetchedKeys: FetcherStateAddressesKeys
  }>
}

export type FetcherStateAddressKeys = {
  firstSignature?: string
  firstSlot?: number
  firstTimestamp?: number
  lastSignature?: string
  lastSlot?: number
  lastTimestamp?: number
}

export type FetcherStateAddressesKeys = Record<string, FetcherStateAddressKeys>

export type FetcherJobState = {
  frequency: number
  lastRun: number
  numRuns: number
  complete: boolean
  usePublicRPC: boolean
}

export type FetcherStateV1 = {
  id: string
  forward: FetcherJobState
  backward: FetcherJobState
  addresses: FetcherStateAddressesKeys
}

export type InstructionContext = {
  parentTx: AlephParsedTransaction
  parentIx?: AlephParsedInstruction
  ix: AlephParsedInstruction | AlephParsedInnerInstruction
}

export type InstructionContextV1 = {
  parentTx: ParsedTransactionV1
  parentIx?: ParsedInstructionV1
  ix: ParsedInstructionV1 | ParsedInnerInstructionV1
}

export type TransactionFetcherJobRunnerOptions = Omit<
  FetcherJobRunnerOptions,
  'intervalFn'
> & {
  iterationFetchLimit?: number
}

export type TransactionFetcherForwardJobRunnerOptions = Omit<
  TransactionFetcherJobRunnerOptions,
  'interval'
> & {
  interval?: number
  ratio?: number
  ratioThreshold?: number
}

export type SignatureFetcherForwardJobRunnerOptions =
  TransactionFetcherForwardJobRunnerOptions

export type TransactionFetcherBackwardJobRunnerOptions =
  TransactionFetcherJobRunnerOptions & {
    fetchUntil?: string[]
  }

export type SignatureFetcherBackwardJobRunnerOptions =
  TransactionFetcherJobRunnerOptions & {
    fetchUntil?: string
  }

export interface SignatureFetcherOptions {
  address: string
  forwardJobOptions?: SignatureFetcherForwardJobRunnerOptions
  backwardJobOptions?: SignatureFetcherBackwardJobRunnerOptions
  errorFetching?: ErrorFetching
}

export type Signature = Omit<
  ConfirmedSignatureInfo,
  'memo' | 'confirmationStatus'
> & {
  accountSlotIndex: Record<string, number>
}

export interface AccountInfoFetcherOptions {
  address: string
  subscribeChanges?: boolean
}

export interface AccountInfo {
  address: string
  executable: boolean
  owner: string
  lamports: number
  data: any
  rentEpoch?: number
}

export type PendingWork<T> = {
  id: string
  time: number
  payload: T
}
