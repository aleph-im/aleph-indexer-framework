import { ServiceBroker } from 'moleculer'
import {
  Blockchain,
  PendingEntityStorage,
  RawEntityStorage,
} from '@aleph-indexer/framework'
import {
  EthereumRawTransaction,
  EthereumTransactionFetcher,
} from '@aleph-indexer/ethereum'
import { BscClient } from '../../../../sdk/client.js'

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
