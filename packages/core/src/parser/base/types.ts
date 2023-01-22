export type ParserContext = {
  account: string
  startDate: number
  endDate: number
}

export type ParsedTransactionContext<T> = {
  tx: T
  parserContext: ParserContext
}
