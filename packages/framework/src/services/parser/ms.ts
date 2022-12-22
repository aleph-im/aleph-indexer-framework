import { ServiceBroker, Context, Service } from 'moleculer'
import {
  ParsedAccountInfoV1,
  SolanaParsedInstructionV1,
  RawAccountInfo,
  RawInstruction,
  RawTransaction,
  SolanaRawTransaction,
  AlephParsedInnerTransaction,
  ParsedTransaction,
} from '@aleph-indexer/core'
import { MsIds, MainFactory } from '../common.js'
import { ParserMsMain } from './main.js'
import { RawTransactionMsg } from './src/types.js'

/**
 * A wrapper of the Molueculer service to expose the main fetcher service through the broker.
 */
export class ParserMs<
  T extends RawTransaction = SolanaRawTransaction,
  P = AlephParsedInnerTransaction,
  PT extends ParsedTransaction<P> = ParsedTransaction<P>,
> extends Service {
  public static mainFactory: MainFactory<ParserMsMain>

  protected main!: ParserMsMain<T, P, PT>

  constructor(broker: ServiceBroker) {
    super(broker)

    this.main = ParserMs.mainFactory(broker) as any

    this.parseServiceSchema({
      name: MsIds.Parser,
      events: {
        'fetcher.txs': this.onTxs,
      },
      actions: {
        parseTransaction: this.parseTransaction,
        parseInstruction: this.parseInstruction,
        parseAccountData: this.parseAccountData,
      },
    })
  }

  onTxs(chunk: RawTransactionMsg<T>[]): Promise<void> {
    return this.main.onTxs(chunk)
  }

  async parseTransaction(ctx: Context<{ payload: T }>): Promise<PT> {
    const { payload } = ctx.params
    return this.main.parseTransaction(payload)
  }

  parseInstruction(
    ctx: Context<{ payload: RawInstruction }>,
  ): Promise<RawInstruction | SolanaParsedInstructionV1> {
    const { payload } = ctx.params
    return this.main.parseInstruction(payload)
  }

  parseAccountData(
    ctx: Context<{ account: string; payload: RawAccountInfo }>,
  ): Promise<RawAccountInfo | ParsedAccountInfoV1> {
    const { account, payload } = ctx.params
    return this.main.parseAccountData(account, payload)
  }
}
