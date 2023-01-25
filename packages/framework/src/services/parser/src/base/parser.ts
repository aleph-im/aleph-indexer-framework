import { ParsedTransaction, RawTransaction } from '../../../../types/common.js'
import {
  BlockchainParserI,
  ParseAccountStateRequestArgs,
  ParseTransactionRequestArgs,
} from './types.js'

export abstract class BaseParser<
  T extends RawTransaction,
  PT extends ParsedTransaction<any>,
  S = unknown,
  PS = unknown,
> implements BlockchainParserI<T, PT, S, PS>
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

  abstract parseTransaction(
    args: ParseTransactionRequestArgs<T>,
  ): Promise<T | PT>

  abstract parseAccountState(
    args: ParseAccountStateRequestArgs<S>,
  ): Promise<S | PS>
}
