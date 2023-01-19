import { ParsedTransaction, RawTransaction } from '@aleph-indexer/core'
import { BlockchainRequestArgs } from '../../../types.js'

/**
 * Contains the original and parsed data, as well as the context of the parsing.
 */
export type ParseElement = {
  id: string
  address: string
  /**
   * The original data.
   */
  payload: unknown
  /**
   * The parsed data.
   */
  parsed: unknown
  timestamp: number
}

export type Transaction = ParseElement & {
  type: string
}

export type Instruction = ParseElement & {
  type: string
}

export type AccountData = ParseElement & {
  type: string
}

export type ParseResult = Transaction | Instruction | AccountData

export type RawTransactionWithPeers<T extends RawTransaction> = {
  peers: string[]
  tx: T
}

export type RawTransactionMsg<T extends RawTransaction> =
  | T
  | RawTransactionWithPeers<T>

export type ParsedTransactionMsg<T> = {
  peers?: string[]
  tx: T
}

// -----------------------------------

/**
 * Abstract class to base all parsers on. It is created in a monadic form,
 * so that the `parse` method should be callable on raw and parsed data.
 * Each parser has the option to accept and return:
 * - raw data
 * - parsed data
 * - `undefined`
 * The `FreeParser` has the most freedoms of all parsers:
 * - allows skipping parsing if the data is not parsable (returning the original data)
 * - allows filtering the data (returning `undefined` if the data should be filtered out)
 * @template R The type of the raw data to parse.
 * @template P The type of the parsed data.
 */
export abstract class FreeParser<R = any, P = any> {
  /**
   * Parses the given data.
   * @param data Data to be parsed.
   * @param context Additional context, if needed.
   */
  abstract parse(
    data: R | P,
    context?: any,
  ): R | P | undefined | Promise<R | P | undefined>
}

/**
 * Defined parsers do not allow `undefined` types.
 * The output can be of type `R` or `P`.
 * @template R The type of the raw data to parse.
 * @template P The type of the parsed data.
 */
export abstract class DefinedParser<
  R extends Omit<any, 'undefined'> = Omit<any, 'undefined'>,
  P extends Omit<any, 'undefined'> = Omit<any, 'undefined'>,
> extends FreeParser<R, P> {
  abstract parse(data: R | P, context?: any): R | P | Promise<R | P>
}

/**
 * Strict parsers do not allow `undefined` types
 * and do not allow returning raw data.
 * @template R The type of the raw data to parse.
 * @template P The type of the parsed data.
 */
export abstract class StrictParser<
  R extends Omit<any, 'undefined'> = Omit<any, 'undefined'>,
  P extends Omit<any, 'undefined'> = Omit<any, 'undefined'>,
> extends DefinedParser<R, P> {
  abstract parse(data: R | P, context?: any): P | Promise<P>
}

// ----------------------------------

export type ParseTransactionRequestArgs<T extends RawTransaction> =
  BlockchainRequestArgs & {
    tx: T
  }

export type ParseAccountStateRequestArgs<S> = BlockchainRequestArgs & {
  account: string
  state: S
}

// -------------------------------------------

export interface BlockchainParserI<
  T extends RawTransaction,
  PT extends ParsedTransaction<any>,
  S = unknown,
  PS = unknown,
> {
  start(): Promise<void>
  stop(): Promise<void>

  /**
   * Parses a raw transaction.
   * @param args The raw transaction to parse.
   */
  parseTransaction(args: ParseTransactionRequestArgs<T>): Promise<T | PT>

  /**
   * Parses a raw account state.
   * If the account state is not parsable, the raw state is returned.
   * @param args The raw account data to parse, usually a buffer.
   */
  parseAccountState(args: ParseAccountStateRequestArgs<S>): Promise<S | PS>
}
