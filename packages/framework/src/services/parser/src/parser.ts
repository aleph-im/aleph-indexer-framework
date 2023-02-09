import { ParsedEntity, RawEntity } from '../../../types.js'
import { BlockchainParserI, ParseEntityRequestArgs } from './types.js'

export abstract class BaseParser<
  RE extends RawEntity = RawEntity,
  PE extends ParsedEntity<unknown> = ParsedEntity<unknown>,
> implements BlockchainParserI<RE, PE>
{
  constructor() {
    // @note: noop
  }

  async start(): Promise<void> {
    // @note: noop
  }

  async stop(): Promise<void> {
    // @note: noop
  }

  abstract parseEntity(args: ParseEntityRequestArgs<RE>): Promise<RE | PE>
}
