import { ServiceBroker, Context, Service } from 'moleculer'
import {
  ParsedAccountInfoV1,
  ParsedInstructionV1,
  ParsedTransactionV1,
  RawAccountInfo,
  RawInstruction,
  RawTransaction,
} from '@aleph-indexer/core'
import { MsIds, MainFactory } from '../common.js'
import { ParserMsMain } from './main.js'

/**
 * A wrapper of the Molueculer service to expose the main fetcher service through the broker.
 */
export class ParserMs extends Service {
  public static mainFactory: MainFactory<ParserMsMain>

  protected main!: ParserMsMain

  constructor(broker: ServiceBroker) {
    super(broker)

    this.main = ParserMs.mainFactory(broker)

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

  onTxs(chunk: RawTransaction[]): Promise<void> {
    return this.main.onTxs(chunk)
  }

  async parseTransaction(
    ctx: Context<{ payload: RawTransaction }>,
  ): Promise<ParsedTransactionV1> {
    const { payload } = ctx.params
    return this.main.parseTransaction(payload)
  }

  parseInstruction(
    ctx: Context<{ payload: RawInstruction }>,
  ): Promise<RawInstruction | ParsedInstructionV1> {
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
