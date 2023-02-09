import { ServiceBroker } from 'moleculer'
import { Blockchain, FetcherClientI } from '@aleph-indexer/framework'
import { EthereumFetcherClient } from '@aleph-indexer/ethereum'

export class BscFetcherClient
  extends EthereumFetcherClient
  implements FetcherClientI {}

export async function bscFetcherClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<FetcherClientI> {
  return new BscFetcherClient(blockchainId, broker)
}
