import { ServiceBroker } from 'moleculer'
import { Blockchain, FetcherClientI } from '@aleph-indexer/framework'
import { EthereumFetcherClient } from '@aleph-indexer/ethereum'

export class OasysFetcherClient
  extends EthereumFetcherClient
  implements FetcherClientI {}

export async function oasysFetcherClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<FetcherClientI> {
  return new OasysFetcherClient(blockchainId, broker)
}
