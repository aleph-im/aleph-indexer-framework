import { ServiceBroker } from 'moleculer'
import {
  BaseIndexerClient,
  Blockchain,
  IndexableEntityType,
  IndexerClientI,
} from '@aleph-indexer/framework'
import { normalizeAccount, normalizeEntityId } from '../../utils/normalize.js'

export default class SolanaIndexerClient
  extends BaseIndexerClient
  implements IndexerClientI
{
  normalizeAccount(account: string): string {
    return normalizeAccount(account)
  }

  normalizeEntityId(entity: IndexableEntityType, id: string): string {
    return normalizeEntityId(entity, id)
  }
}

export async function solanaIndexerClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<IndexerClientI> {
  return new SolanaIndexerClient(blockchainId, broker)
}
