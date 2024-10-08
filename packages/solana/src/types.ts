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
  LoadedAddresses,
  ParsedAddressTableLookup,
} from '@solana/web3.js'
import { RawEntity } from '@aleph-indexer/framework'
import { ProgramErrorType, TransactionErrorType } from './utils/constants.js'

export { ProgramErrorType, TransactionErrorType } from './utils/constants.js'

export type ErrorCatalogItem = { code: number; name: string; msg?: string }
export type ErrorCatalog = ErrorCatalogItem[]

// -------------- RAW TRANSACTIONS -------------------

export type RawParsedInstructionData = {
  type: string
  info: any
}

/**
 * Customisation of the solana ParsedInstruction type by modifying
 * the parsed info and the type of the program address to string,
 * it defines the raw RPC response without any processing.
 */
export type RawParsedInstruction = Omit<
  ParsedInstruction,
  'programId' | 'parsed'
> & {
  programId: string
  parsed: RawParsedInstructionData | any
}

/**
 * Customisation of the solana PartiallyDecodedInstruction type by
 * modifying the types of accounts array and the program address to
 * strings, it defines the raw RPC response without any processing.
 */
export type RawPartiallyDecodedInstruction = Omit<
  PartiallyDecodedInstruction,
  'programId' | 'accounts'
> & {
  programId: string
  accounts: string[]
}

/**
 * Raw Instruction type
 */
export type SolanaRawInstruction =
  | RawParsedInstruction
  | RawPartiallyDecodedInstruction

/**
 * Customisation of the solana ParsedInnerInstruction type by
 * modifying the instruction property, it defines the raw RPC
 * response without any processing.
 */
export type RawInnerInstructionList = Omit<
  ParsedInnerInstruction,
  'instructions'
> & {
  instructions: SolanaRawInstruction[]
}

/**
 * Customisation of the solana LoadedAddresses type by modifying
 * the wirtable and readonly properties from PublicKeys to strings,
 * it defines the raw RPC response without any processing.
 */
export type RawLoadedAddresses = Omit<
  LoadedAddresses,
  'writable' | 'readonly'
> & {
  writable: string[]
  readonly: string[]
}

/**
 * Customisation of the solana ParsedTransactionMeta type by modifying
 * the innerInstructions and readonly loadedAddresses to define the raw
 * RPC response without any processing.
 */
export type RawConfirmedTransactionMeta = Omit<
  ParsedTransactionMeta,
  'innerInstructions' | 'loadedAddresses'
> & {
  innerInstructions?: RawInnerInstructionList[] | null
  loadedAddresses?: RawLoadedAddresses | null
}

/**
 * Customisation of the solana ParsedMessageAccount type by modifying the pubkey
 * property from PublicKey to string, it defines the raw RPC response without any
 * processing.
 */
export type RawMessageAccount = Omit<ParsedMessageAccount, 'pubkey'> & {
  pubkey: string
}

export type RawParsedAddressTableLookup = Omit<
  ParsedAddressTableLookup,
  'accountKey'
> & {
  accountKey: string
}

/**
 * Customisation of the solana ParsedMessage type by modifying accountKeys,
 * instructions and addressTableLookups properties to define the raw RPC
 * response without any processing.
 */
export type RawParsedMessage = Omit<
  ParsedMessage,
  'accountKeys' | 'instructions' | 'addressTableLookups'
> & {
  accountKeys: RawMessageAccount[]
  instructions: SolanaRawInstruction[]
  addressTableLookups?: RawParsedAddressTableLookup[] | null
}

/**
 * Customisation of the ParsedTransaction solana type by modifying the message
 * property to define the raw RPC response without any processing.
 */
export type RawInnerTransaction = Omit<ParsedTransaction, 'message'> & {
  message: RawParsedMessage
}

/**
 * Expected JSON RPC response for the "getTransaction" message
 */
export type RawParsedTransactionWithMeta = Omit<
  ParsedTransactionWithMeta,
  'meta' | 'transaction'
> & {
  meta: RawConfirmedTransactionMeta | null
  transaction: RawInnerTransaction
}

/**
 * Expected JSON RPC response for the "getTransaction" message and a confirmed
 * signature with its status
 */
export type SolanaRawTransactionOld = ConfirmedSignatureInfo &
  RawParsedTransactionWithMeta

/**
 * Expected JSON RPC response for the "getTransaction" message
 */
export type SolanaRawTransaction = RawEntity &
  RawParsedTransactionWithMeta & {
    signature: string
    timestamp: number
  }

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

export type SolanaParsedInstruction = AlephParsedInstruction

export type AlephParsedInnerInstruction = Omit<
  AlephParsedInstruction,
  'innerInstructions'
>

export type SolanaParsedInnerInstruction = AlephParsedInnerInstruction

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

export type AlephParsedTransaction = Omit<SolanaRawTransactionOld, 'parsed'> & {
  parsed: AlephParsedInnerTransaction
  index: number
}

export type SolanaParsedTransaction = Omit<
  SolanaRawTransaction,
  'parsed' | 'transaction'
> & {
  id: string
  parsed: AlephParsedInnerTransaction
  index: number
  signature: string
  blockTime?: number
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

/**
 * Defines the instruction event type and its info.
 */
export type SolanaParsedEvent<EventType, InfoType> = RawEventBase & {
  parsed: {
    type: EventType
    info: InfoType
  }
}
