import { FetcherClientI } from '../../interface.js'
import { FetchAccountTransactionsBySlotRequestArgs } from '../../src/solana/types.js'
import { BaseFetcherClient } from '../base/client.js'

export default class SolanaFetcherClient
  extends BaseFetcherClient
  implements FetcherClientI
{
  async fetchAccountTransactionsBySlot(
    args: Omit<FetchAccountTransactionsBySlotRequestArgs, 'blockchainId'>,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.invokeBlockchainMethod({
      partitionKey: args.account,
      method: 'fetchAccountTransactionsBySlot',
      args: {
        indexerId: this.broker.nodeID,
        ...args,
      },
    })
  }
}
