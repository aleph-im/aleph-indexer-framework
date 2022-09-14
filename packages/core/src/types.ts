import {
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
  ParsedTransactionMeta,
  ParsedInnerInstruction,
  ParsedInstruction,
  ParsedMessage,
  ParsedMessageAccount,
  ParsedTransaction,
  PartiallyDecodedInstruction,
  VoteAccountInfo as VAI,
  AccountInfo,
} from '@solana/web3.js'
import { ProgramErrorType, TransactionErrorType } from './utils/error.js'

export { ProgramErrorType, TransactionErrorType } from './utils/error.js'

export type ErrorCatalogItem = { code: number; name: string; msg?: string }
export type ErrorCatalog = ErrorCatalogItem[]

// -------------- RAW TRANSACTIONS -------------------

export type RawParsedInstructionData = {
  type: string
  info: any
}

export type RawParsedInstruction = Omit<
  ParsedInstruction,
  'programId' | 'parsed'
> & {
  programId: string
  parsed: RawParsedInstructionData
}

export type RawPartiallyDecodedInstruction = Omit<
  PartiallyDecodedInstruction,
  'programId' | 'accounts'
> & {
  programId: string
  accounts: string[]
}

export type RawInstruction =
  | RawParsedInstruction
  | RawPartiallyDecodedInstruction

export type RawInnerInstructionList = Omit<
  ParsedInnerInstruction,
  'instructions'
> & {
  instructions: RawInstruction[]
}

export type RawConfirmedTransactionMeta = Omit<
  ParsedTransactionMeta,
  'innerInstructions'
> & {
  innerInstructions?: RawInnerInstructionList[] | null
}

export type RawMessageAccount = Omit<ParsedMessageAccount, 'pubkey'> & {
  pubkey: string
}

export type RawParsedMessage = Omit<
  ParsedMessage,
  'accountKeys' | 'instructions'
> & {
  accountKeys: RawMessageAccount[]
  instructions: RawInstruction[]
}

export type RawInnerTransaction = Omit<ParsedTransaction, 'message'> & {
  message: RawParsedMessage
}

export type RawParsedTransactionWithMeta = Omit<
  ParsedTransactionWithMeta,
  'meta' | 'transaction'
> & {
  meta: RawConfirmedTransactionMeta | null
  transaction: RawInnerTransaction
}

export type RawTransaction = ConfirmedSignatureInfo &
  RawParsedTransactionWithMeta

export type RawTransactionV1 = RawParsedTransactionWithMeta

export type RawAccountInfo = AccountInfo<Buffer>

// -------------- ALEPH PARSED -------------------

export type AlephParsedParsedInstruction = RawParsedInstruction & {
  index: number
  innerInstructions?: AlephParsedInnerInstruction[]
}

export type AlephParsedPartiallyDecodedInstruction =
  RawPartiallyDecodedInstruction & {
    index: number
    innerInstructions?: AlephParsedInnerInstruction[]
  }

export type AlephParsedInstruction =
  | AlephParsedParsedInstruction
  | AlephParsedPartiallyDecodedInstruction

export type ParsedInstructionV1 = AlephParsedInstruction

export type AlephParsedInnerInstruction = Omit<
  AlephParsedInstruction,
  'innerInstructions'
>

export type ParsedInnerInstructionV1 = AlephParsedInnerInstruction

export type AlephParsedErrorIx = {
  index: number
  innerIndex?: number
  type: ProgramErrorType
  customCode?: number
}

export type AlephParsedError = {
  type: TransactionErrorType
  ix?: AlephParsedErrorIx
}

export type AlephParsedInnerTransaction = Omit<
  RawInnerTransaction,
  'message'
> & {
  message: Omit<RawParsedMessage, 'instructions'> & {
    instructions: AlephParsedInstruction[]
  }
  error?: AlephParsedError
}

export type AlephParsedTransaction = Omit<RawTransaction, 'parsed'> & {
  parsed: AlephParsedInnerTransaction
  index: number
}

export type ParsedTransactionV1 = Omit<
  RawTransactionV1,
  'parsed' | 'transaction'
> & {
  parsed: AlephParsedInnerTransaction
  index: number
  signature: string
  blocktime: number
  slot: number
}

export interface AlephParsedTransactionWithAccounts
  extends AlephParsedTransaction {
  accounts: string[]
}

export type VoteAccountInfo = VAI & {
  delinquent: boolean
}

export type AlephParsedAccountInfo<T = unknown> = RawAccountInfo & {
  parsed: T
}

export type ParsedAccountInfoV1 = AlephParsedAccountInfo

// -------------- RAW EVENTS -------------------

export type RawEventBase = Omit<AlephParsedParsedInstruction, 'parsed'> & {
  program: string
  programId: string
}

export type AlephParsedEvent<EventType, InfoType> = RawEventBase & {
  parsed: {
    type: EventType
    info: InfoType
  }
}

export type EventBase<EventType> = {
  id: string
  timestamp: number
  type: EventType
}
