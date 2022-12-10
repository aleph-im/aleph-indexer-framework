import {
  AlephParsedInnerInstruction,
  AlephParsedInstruction,
  AlephParsedTransaction,
  ParsedInnerInstructionV1,
  ParsedInstructionV1,
  ParsedTransactionV1,
} from '../types.js'

export type ParserContext = {
  account: string
  startDate: number
  endDate: number
}

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
