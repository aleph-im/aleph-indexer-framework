import {
  Blockchain,
  PendingEntityStorage,
  RawEntityStorage,
} from '@aleph-indexer/framework'
import { ServiceBroker } from 'moleculer'
import { BscClient } from '../../../../sdk/client.js'
import { EthereumRawTransaction } from '../../../../types.js'
import { EthereumTransactionFetcher } from '@aleph-indexer/ethereum'

export class BscTransactionFetcher extends EthereumTransactionFetcher {
  constructor(
    bscClient: BscClient,
    broker: ServiceBroker,
    pendingEntityDAL: PendingEntityStorage,
    pendingEntityCacheDAL: PendingEntityStorage,
    pendingEntityFetchDAL: PendingEntityStorage,
    entityCacheDAL: RawEntityStorage<EthereumRawTransaction>,
    blockchainId: Blockchain = Blockchain.Bsc,
  ) {
    super(
      bscClient,
      broker,
      pendingEntityDAL,
      pendingEntityCacheDAL,
      pendingEntityFetchDAL,
      entityCacheDAL,
      blockchainId,
    )
  }
}
