import {
  BlockchainRequestArgs,
  ParsedTransactionContext,
} from '@aleph-indexer/framework'
import {
  SolanaParsedInnerInstruction,
  SolanaParsedInstruction,
  SolanaParsedTransaction,
} from '../../../types.js'

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
