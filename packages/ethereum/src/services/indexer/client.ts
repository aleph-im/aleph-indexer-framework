import { ServiceBroker } from 'moleculer'
import {
  BaseIndexerClient,
  BlockchainId,
  IndexerClientI,
} from '@aleph-indexer/framework'
import { normalizeAccount, normalizeEntityId } from '../../utils/normalize.js'

// @note: partitionKey is based on account param, and the "hash(account)" could change depending
// on the address format and case-sensitiveness
export class EthereumIndexerClient
  extends BaseIndexerClient
  implements IndexerClientI
{
  normalizeAccount = normalizeAccount
  normalizeEntityId = normalizeEntityId
}

export async function ethereumIndexerClientFactory(
  blockchainId: BlockchainId,
  broker: ServiceBroker,
): Promise<IndexerClientI> {
  return new EthereumIndexerClient(blockchainId, broker)
}
