import { Blockchain } from '@aleph-indexer/core'

export type BlockchainRequestArgs = {
  blockchainId: Blockchain
}

export type InvokeBlockchainMethodRequestArgs<A> = BlockchainRequestArgs & {
  partitionKey: string
  method: string
  args: A
}
