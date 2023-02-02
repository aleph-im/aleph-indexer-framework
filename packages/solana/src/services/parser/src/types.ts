import { BlockchainRequestArgs } from '@aleph-indexer/framework'
import {
  SolanaParsedInnerInstruction,
  SolanaParsedInstruction,
  SolanaParsedTransaction,
} from '../../../types.js'

export type SolanaParsedInstructionContext = {
  parentTransaction: SolanaParsedTransaction
  parentInstruction?: SolanaParsedInstruction
  instruction: SolanaParsedInstruction | SolanaParsedInnerInstruction
}

export type ParseInstructionRequestArgs<I> = BlockchainRequestArgs & {
  ix: I
}
