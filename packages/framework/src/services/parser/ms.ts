import { ServiceBroker, Context, Service } from 'moleculer'
import {
  Blockchain,
  IndexableEntityType,
  ParsedEntity,
  RawEntity,
} from '../../types.js'
import { MsIds, MainFactory } from '../common.js'
import { ParserMsMain } from './main.js'
import { ParseEntityRequestArgs, RawEntityMsg } from './src/types.js'

/**
 * A wrapper of the Molueculer service to expose the main fetcher service through the broker.
 */
export class ParserMs<
  RE extends RawEntity = RawEntity,
  PE extends ParsedEntity<unknown> = ParsedEntity<unknown>,
> extends Service {
  public static mainFactory: MainFactory<ParserMsMain>
  public static supportedBlockchains: Blockchain[]
  public static supportedEntities: IndexableEntityType[] =
    Object.values(IndexableEntityType)

  protected main!: ParserMsMain<RE, PE>

  constructor(broker: ServiceBroker) {
    super(broker)

    this.main = ParserMs.mainFactory(broker) as any

    const events = ParserMs.supportedBlockchains.reduce((acc, blockchainId) => {
      for (const type of ParserMs.supportedEntities) {
        acc[`fetcher.${blockchainId}.${type}`] = this.onEntities.bind(
          this,
          type,
          blockchainId,
        )
      }

      return acc
    }, {} as Record<string, (chunk: RawEntityMsg<RE>[]) => Promise<void>>)

    this.parseServiceSchema({
      name: MsIds.Parser,
      events,
      actions: {
        parseEntity: this.parseEntity,
      },
    })
  }

  onEntities(
    type: IndexableEntityType,
    blockchainId: Blockchain,
    chunk: RawEntityMsg<RE>[],
  ): Promise<void> {
    return this.main.onEntities(type, blockchainId, chunk)
  }

  parseEntity(ctx: Context<ParseEntityRequestArgs<RE>>): Promise<RE | PE> {
    return this.main.parseEntity(ctx.params)
  }
}
