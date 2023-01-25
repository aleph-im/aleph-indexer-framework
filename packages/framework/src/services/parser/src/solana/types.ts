import {
  SolanaParsedInnerInstruction,
  SolanaParsedInstruction,
  SolanaParsedTransaction,
} from '../../../../types/solana.js'
import { BlockchainRequestArgs } from '../../../types.js'
import { ParsedTransactionContext } from '../base/types.js'

export type SolanaParsedTransactionContext =
  ParsedTransactionContext<SolanaParsedTransaction>

export type SolanaInstructionContext = {
  txContext: SolanaParsedTransactionContext
  parentIx?: SolanaParsedInstruction
  ix: SolanaParsedInstruction | SolanaParsedInnerInstruction
}

export type ParseInstructionRequestArgs<I> = BlockchainRequestArgs & {
  ix: I
}
