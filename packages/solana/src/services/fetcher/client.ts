import { ServiceBroker } from 'moleculer'
import {
  BaseFetcherClient,
  Blockchain,
  FetcherClientI,
} from '@aleph-indexer/framework'
import { FetchAccountTransactionsBySlotRequestArgs } from './src/types.js'

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

export async function solanaFetcherClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<FetcherClientI> {
  return new SolanaFetcherClient(blockchainId, broker)
}
