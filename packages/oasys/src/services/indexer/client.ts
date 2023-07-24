import { ServiceBroker } from 'moleculer'
import { Blockchain, IndexerClientI } from '@aleph-indexer/framework'
import { EthereumIndexerClient } from '@aleph-indexer/ethereum'

export class OasysIndexerClient
  extends EthereumIndexerClient
  implements IndexerClientI {}

export async function oasysIndexerClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<IndexerClientI> {
  return new OasysIndexerClient(blockchainId, broker)
}
