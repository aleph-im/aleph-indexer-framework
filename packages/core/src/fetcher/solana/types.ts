import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { ErrorFetching } from '../../rpc/index.js'
import { BaseFetcherJobRunnerOptions, ParserContext } from '../base/index.js'
import {
  AlephParsedInnerInstruction,
  AlephParsedInstruction,
  AlephParsedTransaction,
  ParsedInnerInstructionV1,
  ParsedInstructionV1,
  ParsedTransactionV1,
} from '../../types.js'

export type SolanaFetcherCursor = {
  firstSignature?: string
  firstSlot?: number
  firstTimestamp?: number
  lastSignature?: string
  lastSlot?: number
  lastTimestamp?: number
}

// --------------------------

export type ParsedTransactionContextV1 = {
  tx: ParsedTransactionV1
  parserContext: ParserContext
}

export type SolanaInstructionContext = {
  parentTx: AlephParsedTransaction
  parentIx?: AlephParsedInstruction
  ix: AlephParsedInstruction | AlephParsedInnerInstruction
}

export type SolanaInstructionContextV1 = {
  txContext: ParsedTransactionContextV1
  parentIx?: ParsedInstructionV1
  ix: ParsedInstructionV1 | ParsedInnerInstructionV1
}

export type SolanaSignatureFetcherJobRunnerOptions<C> = Omit<
  BaseFetcherJobRunnerOptions<C>,
  'handleFetch' | 'updateCursor'
> & {
  iterationFetchLimit?: number
}

export type SolanaSignatureFetcherForwardJobRunnerOptions<C> = Omit<
  SolanaSignatureFetcherJobRunnerOptions<C>,
  'interval'
> & {
  interval?: number
  ratio?: number
  ratioThreshold?: number
}

export type SolanaSignatureFetcherBackwardJobRunnerOptions<C> =
  SolanaSignatureFetcherJobRunnerOptions<C> & {
    fetchUntil?: string
  }

export interface SolanaSignatureFetcherOptions<C> {
  address: string
  forward?: SolanaSignatureFetcherForwardJobRunnerOptions<C>
  backward?: SolanaSignatureFetcherBackwardJobRunnerOptions<C>
  errorFetching?: ErrorFetching
  indexSignatures(signatures: Signature[], goingForward: boolean): Promise<void>
}

export type Signature = Omit<
  ConfirmedSignatureInfo,
  'memo' | 'confirmationStatus'
> & {
  accountSlotIndex: Record<string, number>
}

export type TransactionFetcherBackwardJobRunnerOptions<C> =
  SolanaSignatureFetcherJobRunnerOptions<C> & {
    fetchUntil?: string[]
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
