import { ServiceBroker } from 'moleculer'
import { BlockchainId } from '../../types.js'
import {
  MsIds,
  getRegistryNodesWithService,
  waitForAllNodesWithService,
} from '../common.js'
import { FetcherClientI } from './interface.js'
import { FetcherStateRequestArgs, FetcherState } from './src/types.js'

/**
 * Client to access the main fetcher service through the broker.
 */
export class FetcherMsClient {
  /**
   * @param broker The broker instance to retrieve the actual service from.
   * @param msId The moleculer service id of the fetcher service.
   */
  constructor(
    protected broker: ServiceBroker,
    protected blockchains: Record<BlockchainId, FetcherClientI>,
    protected msId: MsIds = MsIds.Fetcher,
  ) {}

  useBlockchain(blockchainId: BlockchainId): FetcherClientI {
    return this.getBlockchainClientInstance(blockchainId)
  }

  waitForAll(indexers: string[]): Promise<void> {
    return waitForAllNodesWithService(this.broker, indexers, this.msId)
  }

  waitForService(): Promise<void> {
    return this.broker.waitForServices(this.msId)
  }

  getAllFetchers(): string[] {
    return getRegistryNodesWithService(this.broker, this.msId)
  }

  getAllBlockchains(): BlockchainId[] {
    return Object.keys(this.blockchains) as BlockchainId[]
  }

  getNodeId(): string {
    return this.broker.nodeID
  }

  getFetcherState(args: FetcherStateRequestArgs): Promise<FetcherState[]> {
    return this.broker.call(`${this.msId}.getFetcherState`, args, {
      nodeID: args.fetcher,
    })
  }

  protected getBlockchainClientInstance(
    blockchainId: BlockchainId,
  ): FetcherClientI {
    const instance = this.blockchains[blockchainId]

    if (!instance) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return instance
  }
}
