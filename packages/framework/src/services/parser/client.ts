import { ServiceBroker } from 'moleculer'
import {
  ParsedAccountInfoV1,
  ParsedInstructionV1,
  ParsedTransactionV1,
  RawAccountInfo,
  RawInstruction,
  RawTransactionV1,
} from '@aleph-indexer/core'
import {
  MsClientWithEvents,
  MsIds,
  waitForAllNodesWithService,
} from '../common.js'
import { ParserMsI } from './interface.js'

/**
 * Client to access the main indexer service through the broker.
 */
export class ParserMsClient
  extends MsClientWithEvents<'txs'>
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
    protected msId: MsIds = MsIds.Parser,
  ) {
    super(broker, msId, clientEvents)
  }

  waitForAll(indexers: string[]): Promise<void> {
    return waitForAllNodesWithService(this.broker, indexers, this.msId)
  }

  waitForService(): Promise<void> {
    return this.broker.waitForServices(this.msId)
  }

  async parseTransaction(
    payload: RawTransactionV1,
  ): Promise<ParsedTransactionV1> {
    return this.broker.call(`${this.msId}.parseTransaction`, {
      payload,
    })
  }

  async parseInstruction(
    payload: RawInstruction,
  ): Promise<RawInstruction | ParsedInstructionV1> {
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

export class ParserMsClientWithEvents extends MsClientWithEvents<'onTxs'> {
  constructor(
    protected broker: ServiceBroker,
    protected msId: MsIds = MsIds.Parser,
  ) {
    super(broker, msId)
  }
}
