import { ServiceBroker } from 'moleculer'
import { Blockchain, IndexerClientI } from '@aleph-indexer/framework'
import { EthereumIndexerClient } from '@aleph-indexer/ethereum'

export class BscIndexerClient
  extends EthereumIndexerClient
  implements IndexerClientI {}

export async function bscIndexerClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<IndexerClientI> {
  return new BscIndexerClient(blockchainId, broker)
}
