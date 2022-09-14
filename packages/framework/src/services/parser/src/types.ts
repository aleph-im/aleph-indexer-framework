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
