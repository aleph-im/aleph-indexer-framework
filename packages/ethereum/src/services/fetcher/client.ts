import { ServiceBroker } from 'moleculer'
import {
  BaseFetcherClient,
  Blockchain,
  FetcherClientI,
} from '@aleph-indexer/framework'

export class EthereumFetcherClient
  extends BaseFetcherClient
  implements FetcherClientI {}

export async function ethereumFetcherClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<FetcherClientI> {
  return new EthereumFetcherClient(blockchainId, broker)
}
