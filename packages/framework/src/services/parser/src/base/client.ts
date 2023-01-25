import { ServiceBroker } from 'moleculer'
import { MsIds } from '../../../common.js'
import { ParserClientI } from '../../interface.js'
import {
  ParseAccountStateRequestArgs,
  ParseTransactionRequestArgs,
} from './types.js'
import { BlockchainRequestArgs } from '../../../types.js'
import {
  Blockchain,
  ParsedTransaction,
  RawTransaction,
} from '../../../../types/common.js'

export abstract class BaseParserClient<
  T extends RawTransaction,
  PT extends ParsedTransaction<unknown>,
  S = unknown,
  PS = unknown,
> implements ParserClientI<T, PT, S, PS>
{
  constructor(
    protected blockchainId: Blockchain,
    protected broker: ServiceBroker,
    protected msId: MsIds = MsIds.Parser,
  ) {}

  async parseTransaction(
    args: Omit<ParseTransactionRequestArgs<T>, keyof BlockchainRequestArgs>,
  ): Promise<T | PT> {
    return this.broker.call(`${this.msId}.parseTransaction`, {
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  async parseAccountState(
    args: Omit<ParseAccountStateRequestArgs<S>, keyof BlockchainRequestArgs>,
  ): Promise<S | PS> {
    return this.broker.call(`${this.msId}.parseTransaction`, {
      blockchainId: this.blockchainId,
      ...args,
    })
  }
}
