import { Blockchain } from '@aleph-indexer/core'
import { ServiceBroker } from 'moleculer'
import {
  MsIds,
  getRegistryNodesWithService,
  waitForAllNodesWithService,
} from '../common.js'
import { IndexerClientI } from './interface.js'

/**
 * Client to access the main indexer service through the broker.
 */
export class IndexerMsClient {
  /**
   * @param broker The broker instance to retrieve the actual service from.
   * @param msId The moleculer service id of the indexer service.
   */
  constructor(
    protected broker: ServiceBroker,
    protected blockchainIndexerClients: Record<Blockchain, IndexerClientI>,
    protected msId: MsIds = MsIds.Indexer,
  ) {}

  useBlockchain(blockchainId: Blockchain): IndexerClientI {
    return this.getBlockchainIndexerClient(blockchainId)
  }

  waitForAll(indexers: string[]): Promise<void> {
    return waitForAllNodesWithService(this.broker, indexers, this.msId)
  }

  waitForService(): Promise<void> {
    return this.broker.waitForServices(this.msId)
  }

  getAllIndexers(): string[] {
    return getRegistryNodesWithService(this.broker, this.msId)
  }

  getNodeId(): string {
    return this.broker.nodeID
  }

  protected getBlockchainIndexerClient(
    blockchainId: Blockchain,
  ): IndexerClientI {
    const client = this.blockchainIndexerClients[blockchainId]

    if (!client) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return client
  }
}
