import { Parsers } from './common.js'
import { TransactionParser } from './transaction.js'

export * from './common.js'
export * from './event.js'
export * from './transaction.js'
export * from './instruction.js'
export * from './account.js'

export const PARSERS: Parsers = {
  PROGRAMS: {} as Parsers,
}

PARSERS.transaction = new TransactionParser(PARSERS)
