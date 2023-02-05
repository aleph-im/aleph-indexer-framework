import { ServiceBroker } from 'moleculer'
import {
  BaseIndexerClient,
  Blockchain,
  IndexerClientI,
} from '@aleph-indexer/framework'

export class EthereumIndexerClient
  extends BaseIndexerClient
  implements IndexerClientI {}

export async function ethereumIndexerClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<IndexerClientI> {
  return new EthereumIndexerClient(blockchainId, broker)
}
