import { IndexableEntityType, ParsedEntity, RawEntity } from '../../../types.js'
import { BlockchainRequestArgs } from '../../types.js'

export type ParserContext =
  | {
      account: string
      startDate: number
      endDate: number
    }
  | {
      ids: string[]
    }

/**
 * Contains the original and parsed data, as well as the context of the parsing.
 */
// export type ParseElement = {
//   id: string
//   address: string
//   /**
//    * The original data.
//    */
//   payload: unknown
//   /**
//    * The parsed data.
//    */
//   parsed: unknown
//   timestamp: number
// }

// export type Transaction = ParseElement & {
//   type: string
// }

// export type Instruction = ParseElement & {
//   type: string
// }

// export type AccountData = ParseElement & {
//   type: string
// }

// export type ParseResult = Transaction | Instruction | AccountData

export type RawEntityMsg<T> = {
  peers?: string[]
  type: IndexableEntityType
  entity: T
}

export type ParsedEntityMsg<T> = {
  peers?: string[]
  type: IndexableEntityType
  entity: T
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

export type ParseEntityRequestArgs<T extends RawEntity> =
  BlockchainRequestArgs & {
    type: IndexableEntityType
    entity: T
  }

// -------------------------------------------

export interface BlockchainParserI<
  RE extends RawEntity = RawEntity,
  PE extends ParsedEntity<unknown> = ParsedEntity<unknown>,
> {
  start(): Promise<void>
  stop(): Promise<void>

  /**
   * Parses a raw transaction.
   * @param args The raw transaction to parse.
   */
  parseEntity(args: ParseEntityRequestArgs<RE>): Promise<RE | PE>
}
