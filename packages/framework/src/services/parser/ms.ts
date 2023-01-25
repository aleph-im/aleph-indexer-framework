import { ServiceBroker, Context, Service } from 'moleculer'
import {
  Blockchain,
  ParsedTransaction,
  RawTransaction,
} from '../../types/common.js'
import { MsIds, MainFactory } from '../common.js'
import { ParserMsMain } from './main.js'
import {
  ParseAccountStateRequestArgs,
  ParseTransactionRequestArgs,
  RawTransactionMsg,
} from './src/base/types.js'

/**
 * A wrapper of the Molueculer service to expose the main fetcher service through the broker.
 */
export class ParserMs<
  T extends RawTransaction = RawTransaction,
  PT extends ParsedTransaction<unknown> = ParsedTransaction<unknown>,
  S = unknown,
  PS = unknown,
> extends Service {
  public static mainFactory: MainFactory<ParserMsMain>
  public static supportedBlockchains: Blockchain[]

  protected main!: ParserMsMain<T, PT, S, PS>

  constructor(broker: ServiceBroker) {
    super(broker)

    this.main = ParserMs.mainFactory(broker) as any

    const events = ParserMs.supportedBlockchains.reduce((acc, blockchainId) => {
      acc[`fetcher.txs.${blockchainId}`] = this.onTxs.bind(this, blockchainId)
      return acc
    }, {} as Record<string, (chunk: RawTransactionMsg<T>[]) => Promise<void>>)

    this.parseServiceSchema({
      name: MsIds.Parser,
      events,
      actions: {
        parseTransaction: this.parseTransaction,
        parseAccountState: this.parseAccountState,
      },
    })
  }

  onTxs(
    blockchainId: Blockchain,
    chunk: RawTransactionMsg<T>[],
  ): Promise<void> {
    return this.main.onTxs(blockchainId, chunk)
  }

  parseTransaction(
    ctx: Context<ParseTransactionRequestArgs<T>>,
  ): Promise<T | PT> {
    return this.main.parseTransaction(ctx.params)
  }

  parseAccountState(
    ctx: Context<ParseAccountStateRequestArgs<S>>,
  ): Promise<S | PS> {
    return this.main.parseAccountState(ctx.params)
  }
}
