import { BlockchainRequestArgs } from '../../../types.js'

export type ParseInstructionRequestArgs<I> = BlockchainRequestArgs & {
  ix: I
}
