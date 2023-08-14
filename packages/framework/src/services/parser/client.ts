import { ServiceBroker } from 'moleculer'
import { BlockchainId, ParsedEntity, RawEntity } from '../../types.js'
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
    protected blockchains: Record<BlockchainId, ParserClientI<any, any>>,
    protected clientEvents = false,
    protected eventOpts?: EventOptions,
    protected msId: MsIds = MsIds.Parser,
  ) {
    super(broker, msId, clientEvents, eventOpts)
  }

  useBlockchain<
    RE extends RawEntity = RawEntity,
    PE extends ParsedEntity<unknown> = ParsedEntity<unknown>,
  >(blockchainId: BlockchainId): ParserClientI<RE, PE> {
    return this.getBlockchainClientInstance(blockchainId)
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

  waitForAll(indexers: string[]): Promise<void> {
    return waitForAllNodesWithService(this.broker, indexers, this.msId)
  }

  waitForService(): Promise<void> {
    return this.broker.waitForServices(this.msId)
  }

  protected getBlockchainClientInstance<
    RE extends RawEntity = RawEntity,
    PE extends ParsedEntity<unknown> = ParsedEntity<unknown>,
  >(blockchainId: BlockchainId): ParserClientI<RE, PE> {
    const instance = this.blockchains[blockchainId]

    if (!instance) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return instance
  }
}
