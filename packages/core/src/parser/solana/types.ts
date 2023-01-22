import {
  SolanaParsedInnerInstruction,
  SolanaParsedInstruction,
  SolanaParsedTransaction,
} from '../../types'
import { ParsedTransactionContext } from '../base/index.js'

export type SolanaParsedTransactionContext =
  ParsedTransactionContext<SolanaParsedTransaction>

export type SolanaInstructionContext = {
  txContext: SolanaParsedTransactionContext
  parentIx?: SolanaParsedInstruction
  ix: SolanaParsedInstruction | SolanaParsedInnerInstruction
}
