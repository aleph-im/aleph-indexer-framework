import { Blockchain } from '../types'

export type BlockchainRequestArgs = {
  blockchainId: Blockchain
}

export type InvokeBlockchainMethodRequestArgs<A> = BlockchainRequestArgs & {
  partitionKey: string
  method: string
  args: A
}
