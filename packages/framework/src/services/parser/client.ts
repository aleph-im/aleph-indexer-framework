import { ServiceBroker } from 'moleculer'
import {
  Blockchain,
  RawTransaction,
  ParsedTransaction,
} from '@aleph-indexer/core'
import {
  EventOptions,
  getRegistryNodesWithService,
  MsClientWithEvents,
  MsIds,
  waitForAllNodesWithService,
} from '../common.js'
import { ParserClientI } from './interface.js'

type Event = 'txs' | string // | txs.blockchainId | txs.*

/**
 * Client to access the main indexer service through the broker.
 */
export class ParserMsClient extends MsClientWithEvents<Event> {
  /**
   * @param broker The broker instance to retrieve the actual service from.
   * @param clientEvents If true, the client will listen to the events of the service.
   * @param eventOpts The event options
   * @param msId The moleculer service id of the indexer service.
   */
  constructor(
    protected broker: ServiceBroker,
    protected blockchains: Record<
      Blockchain,
      ParserClientI<any, any, any, any>
    >,
    protected clientEvents = false,
    protected eventOpts?: EventOptions,
    protected msId: MsIds = MsIds.Parser,
  ) {
    super(broker, msId, clientEvents, eventOpts)
  }

  useBlockchain<
    T extends RawTransaction,
    PT extends ParsedTransaction<unknown>,
    S = unknown,
    PS = unknown,
  >(blockchainId: Blockchain): ParserClientI<T, PT, S, PS> {
    return this.getBlockchainClientInstance(blockchainId)
  }

  getAllFetchers(): string[] {
    return getRegistryNodesWithService(this.broker, this.msId)
  }

  getAllBlockchains(): Blockchain[] {
    return Object.keys(this.blockchains) as Blockchain[]
  }

  getNodeId(): string {
    return this.broker.nodeID
  }

  waitForAll(indexers: string[]): Promise<void> {
    return waitForAllNodesWithService(this.broker, indexers, this.msId)
  }

  waitForService(): Promise<void> {
    return this.broker.waitForServices(this.msId)
  }

  protected getBlockchainClientInstance<
    T extends RawTransaction,
    PT extends ParsedTransaction<unknown>,
    S = unknown,
    PS = unknown,
  >(blockchainId: Blockchain): ParserClientI<T, PT, S, PS> {
    const instance = this.blockchains[blockchainId]

    if (!instance) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return instance
  }
}
