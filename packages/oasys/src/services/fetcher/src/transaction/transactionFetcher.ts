import { ServiceBroker } from 'moleculer'
import {
  Blockchain,
  PendingEntityStorage,
  RawEntityStorage,
} from '@aleph-indexer/framework'
import { EthereumTransactionFetcher } from '@aleph-indexer/ethereum'
import { OasysClient } from '../../../../sdk/client.js'
import { OasysRawTransaction } from '../../../parser/src/types.js'

export class OasysTransactionFetcher extends EthereumTransactionFetcher {
  constructor(
    client: OasysClient,
    broker: ServiceBroker,
    pendingEntityDAL: PendingEntityStorage,
    pendingEntityCacheDAL: PendingEntityStorage,
    pendingEntityFetchDAL: PendingEntityStorage,
    entityCacheDAL: RawEntityStorage<OasysRawTransaction>,
    blockchainId: Blockchain = Blockchain.Oasys,
  ) {
    super(
      client,
      broker,
      pendingEntityDAL,
      pendingEntityCacheDAL,
      pendingEntityFetchDAL,
      entityCacheDAL,
      blockchainId,
    )
  }
}
