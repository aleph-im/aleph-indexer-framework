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
import {DateTime} from "luxon";

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

export type ParserContextV1 = {
  account: string
  startDate: DateTime
  endDate: DateTime
}

export type ParsedTransactionContextV1 = {
  tx: ParsedTransactionV1
  parserContext: ParserContextV1
}

export type InstructionContext = {
  parentTx: AlephParsedTransaction
  parentIx?: AlephParsedInstruction
  ix: AlephParsedInstruction | AlephParsedInnerInstruction
}

/**
 * Stores ixns and txn info.
 */
export type InstructionContextV1 = {
  txContext: ParsedTransactionContextV1
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
  /**
   * Account address.
   */
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

/**
 * Options where the account address is stored and if it needs to be updated
 * by fetching new transactions.
 */
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
