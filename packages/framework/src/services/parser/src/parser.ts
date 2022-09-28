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
