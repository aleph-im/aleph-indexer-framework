import { ServiceBroker } from 'moleculer'
import { Blockchain } from '../../types.js'
import {
  MsIds,
  getRegistryNodesWithService,
  waitForAllNodesWithService,
} from '../common.js'
import { IndexerClientI } from './interface.js'
import { InvokeMethodRequestArgs } from './src/types.js'

/**
 * Client to access the main indexer service through the broker.
 */
export class IndexerMsClient {
  /**
   * @param broker The broker instance to retrieve the actual service from.
   * @param blockchains Dictionary with blockchain indexer clients.
   * @param msId The moleculer service id of the indexer service.
   */
  constructor(
    protected broker: ServiceBroker,
    protected blockchains: Record<Blockchain, IndexerClientI>,
    protected msId: MsIds = MsIds.Indexer,
  ) {}

  useBlockchain(blockchainId: Blockchain): IndexerClientI {
    return this.getBlockchainClientInstance(blockchainId)
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

  getAllBlockchains(): Blockchain[] {
    return Object.keys(this.blockchains) as Blockchain[]
  }

  getNodeId(): string {
    return this.broker.nodeID
  }

  invokeDomainMethod(args: InvokeMethodRequestArgs): Promise<unknown> {
    return this.broker.call(
      `${this.msId}.invokeDomainMethod`,
      {
        partitionKey: args.partitionKey || args.account,
        ...args,
      },
      { meta: { $streamObjectMode: true }, nodeID: args.indexer },
    )
  }

  protected getBlockchainClientInstance(
    blockchainId: Blockchain,
  ): IndexerClientI {
    const instance = this.blockchains[blockchainId]

    if (!instance) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return instance
  }
}
