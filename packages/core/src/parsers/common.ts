export type Parsers = {
  [key: string]: Parser | Parsers
}

export abstract class Parser<
  D = any,
  R extends Omit<any, 'undefined'> = Omit<any, 'undefined'>,
> {
  constructor(protected parsers: Parsers) {}
  // @note: input can be raw data or already parsed data
  // Parses may filter entities too returning undefined (dont allow undefined as inputs)
  abstract parse(data: D | R, context?: any): R | Promise<R | undefined>
}
