import { BlockchainId } from '../types'

export type BlockchainRequestArgs = {
  blockchainId: BlockchainId
}

export type InvokeBlockchainMethodRequestArgs<A> = BlockchainRequestArgs & {
  partitionKey: string
  method: string
  args: A
}
