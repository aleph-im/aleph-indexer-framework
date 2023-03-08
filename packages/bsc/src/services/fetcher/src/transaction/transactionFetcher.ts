import { ServiceBroker } from 'moleculer'
import {
  Blockchain,
  PendingEntityStorage,
  RawEntityStorage,
} from '@aleph-indexer/framework'
import { EthereumTransactionFetcher } from '@aleph-indexer/ethereum'
import { BscClient } from '../../../../sdk/client.js'
import { BscRawTransaction } from '../../../parser/src/types.js'

export class BscTransactionFetcher extends EthereumTransactionFetcher {
  constructor(
    bscClient: BscClient,
    broker: ServiceBroker,
    pendingEntityDAL: PendingEntityStorage,
    pendingEntityCacheDAL: PendingEntityStorage,
    pendingEntityFetchDAL: PendingEntityStorage,
    entityCacheDAL: RawEntityStorage<BscRawTransaction>,
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
