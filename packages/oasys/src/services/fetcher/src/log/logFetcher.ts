import { ServiceBroker } from 'moleculer'
import { Blockchain, PendingEntityStorage } from '@aleph-indexer/framework'
import {
  EthereumLogFetcher,
  EthereumRawLogStorage,
} from '@aleph-indexer/ethereum'
import { OasysClient } from '../../../../sdk/client.js'

export class OasysLogFetcher extends EthereumLogFetcher {
  constructor(
    protected client: OasysClient,
    protected broker: ServiceBroker,
    protected pendingLogDAL: PendingEntityStorage,
    protected pendingLogCacheDAL: PendingEntityStorage,
    protected pendingLogFetchDAL: PendingEntityStorage,
    protected rawLogDAL: EthereumRawLogStorage,
    protected blockchainId: Blockchain = Blockchain.Oasys,
  ) {
    super(
      client,
      broker,
      pendingLogDAL,
      pendingLogCacheDAL,
      pendingLogFetchDAL,
      rawLogDAL,
      blockchainId,
    )
  }
}
