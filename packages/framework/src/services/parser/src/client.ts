import { ServiceBroker } from 'moleculer'
import { MsIds } from '../../common.js'
import { ParserClientI } from '../interface.js'
import { ParseEntityRequestArgs } from './types.js'
import { BlockchainRequestArgs } from '../../types.js'
import { Blockchain, ParsedEntity, RawEntity } from '../../../types.js'

export abstract class BaseParserClient<
  RE extends RawEntity = RawEntity,
  PE extends ParsedEntity<unknown> = ParsedEntity<unknown>,
> implements ParserClientI<RE, PE>
{
  constructor(
    protected blockchainId: Blockchain,
    protected broker: ServiceBroker,
    protected msId: MsIds = MsIds.Parser,
  ) {}

  async parseEntity(
    args: Omit<ParseEntityRequestArgs<RE>, keyof BlockchainRequestArgs>,
  ): Promise<RE | PE> {
    return this.broker.call(`${this.msId}.parseEntity`, {
      blockchainId: this.blockchainId,
      ...args,
    })
  }
}
