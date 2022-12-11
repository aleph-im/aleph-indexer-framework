export type ParserContext = {
  account: string
  startDate: number
  endDate: number
}

export type ParsedTransactionContextV1<T> = {
  tx: T
  parserContext: ParserContext
}
