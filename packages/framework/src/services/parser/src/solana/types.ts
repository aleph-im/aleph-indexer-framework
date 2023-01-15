import { BlockchainRequestArgs } from '../../../types'

export type ParseInstructionRequestArgs<I> = BlockchainRequestArgs & {
  ix: I
}
