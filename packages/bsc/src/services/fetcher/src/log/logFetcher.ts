import { ServiceBroker } from 'moleculer'
import { Blockchain, PendingEntityStorage } from '@aleph-indexer/framework'
import { EthereumLogFetcher } from '@aleph-indexer/ethereum'
import { BscClient } from '../../../../sdk/client.js'
import { EthereumRawLogStorage } from './dal/rawLog.js'

/**
 * The main class of the fetcher service.
 */
export class BscLogFetcher extends EthereumLogFetcher {
  constructor(
    protected bscClient: BscClient,
    protected broker: ServiceBroker,
    protected pendingLogDAL: PendingEntityStorage,
    protected pendingLogCacheDAL: PendingEntityStorage,
    protected pendingLogFetchDAL: PendingEntityStorage,
    protected rawLogDAL: EthereumRawLogStorage,
    protected blockchainId: Blockchain = Blockchain.Bsc,
  ) {
    super(
      bscClient,
      broker,
      pendingLogDAL,
      pendingLogCacheDAL,
      pendingLogFetchDAL,
      rawLogDAL,
      blockchainId,
    )
  }
}
