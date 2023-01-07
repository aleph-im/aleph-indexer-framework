import { ServiceBroker } from 'moleculer'
import {
  ParsedAccountInfoV1,
  SolanaParsedInstructionV1,
  SolanaParsedTransactionV1,
  RawAccountInfo,
  RawInstruction,
  SolanaRawTransaction,
} from '@aleph-indexer/core'
import {
  EventOptions,
  MsClientWithEvents,
  MsIds,
  waitForAllNodesWithService,
} from '../common.js'
import { ParserMsI } from './interface.js'

type Event = 'txs' | string // | txs.blockchainId | txs.*

/**
 * Client to access the main indexer service through the broker.
 */
export class ParserMsClient
  extends MsClientWithEvents<Event>
  implements ParserMsI
{
  /**
   * @param broker The broker instance to retrieve the actual service from.
   * @param clientEvents If true, the client will listen to the events of the service.
   * @param msId The moleculer service id of the indexer service.
   */
  constructor(
    protected broker: ServiceBroker,
    protected clientEvents = false,
    protected eventOpts?: EventOptions,
    protected msId: MsIds = MsIds.Parser,
  ) {
    super(broker, msId, clientEvents, eventOpts)
  }

  waitForAll(indexers: string[]): Promise<void> {
    return waitForAllNodesWithService(this.broker, indexers, this.msId)
  }

  waitForService(): Promise<void> {
    return this.broker.waitForServices(this.msId)
  }

  async parseTransaction(
    payload: SolanaRawTransaction,
  ): Promise<SolanaParsedTransactionV1> {
    return this.broker.call(`${this.msId}.parseTransaction`, {
      payload,
    })
  }

  async parseInstruction(
    payload: RawInstruction,
  ): Promise<RawInstruction | SolanaParsedInstructionV1> {
    return this.broker.call(`${this.msId}.parseTransaction`, {
      payload,
    })
  }

  async parseAccountData(
    account: string,
    payload: RawAccountInfo,
  ): Promise<RawAccountInfo | ParsedAccountInfoV1> {
    return this.broker.call(`${this.msId}.parseTransaction`, {
      account,
      payload,
    })
  }
}
