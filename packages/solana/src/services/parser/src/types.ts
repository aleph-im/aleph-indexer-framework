import {
  BlockchainRequestArgs,
  ParsedEntityContext,
} from '@aleph-indexer/framework'
import {
  SolanaParsedInnerInstruction,
  SolanaParsedInstruction,
  SolanaParsedTransaction,
} from '../../../types.js'

export type SolanaParsedTransactionContext =
  ParsedEntityContext<SolanaParsedTransaction>

export type SolanaParsedInstructionContext = {
  txContext: SolanaParsedTransactionContext
  parentIx?: SolanaParsedInstruction
  ix: SolanaParsedInstruction | SolanaParsedInnerInstruction
}

export type ParseInstructionRequestArgs<I> = BlockchainRequestArgs & {
  ix: I
}
