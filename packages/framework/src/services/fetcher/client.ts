import { Blockchain } from '@aleph-indexer/core'
import { ServiceBroker } from 'moleculer'
import {
  MsIds,
  getRegistryNodesWithService,
  waitForAllNodesWithService,
} from '../common.js'
import { FetcherClientI } from './interface.js'
import { FetcherStateRequestArgs, FetcherState } from './src/base/types.js'

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
    protected blockchainFetcherClients: Record<Blockchain, FetcherClientI>,
    protected msId: MsIds = MsIds.Fetcher,
  ) {}

  useBlockchain(blockchainId: Blockchain): FetcherClientI {
    return this.getBlockchainFetcherClient(blockchainId)
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

  getNodeId(): string {
    return this.broker.nodeID
  }

  getFetcherState(
    args: FetcherStateRequestArgs,
  ): Promise<Record<Blockchain, FetcherState>> {
    return this.broker.call(`${this.msId}.getFetcherState`, args, {
      nodeID: args.fetcher,
    })
  }

  protected getBlockchainFetcherClient(
    blockchainId: Blockchain,
  ): FetcherClientI {
    const client = this.blockchainFetcherClients[blockchainId]

    if (!client) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return client
  }
}
