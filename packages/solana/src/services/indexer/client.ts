import { ServiceBroker } from 'moleculer'
import {
  BaseIndexerClient,
  Blockchain,
  IndexerClientI,
} from '@aleph-indexer/framework'

export default class SolanaIndexerClient
  extends BaseIndexerClient
  implements IndexerClientI {}

export async function solanaIndexerClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<IndexerClientI> {
  return new SolanaIndexerClient(blockchainId, broker)
}
