/* eslint-disable prettier/prettier */
import { ParsedAccountInfoV1, RawAccountInfo, SolanaParsedTransactionV1, SolanaRawTransaction } from '@aleph-indexer/core'
import { SolanaParser } from '../../../services/parser/src/solana/parser.js'
import { AccountParserLibrary } from '../../../services/parser/src/solana/accountParserLibrary.js'
import { TransactionParser } from '../../../services/parser/src/solana/transactionParser.js'
import { BlockchainParserI } from '../../../services/parser/src/base/types.js'
import { InstructionParserLibrary } from '../../../services/parser/src/solana/instructionParserLibrary.js'

export default (
  basePath: string,
  layoutPath?: string,
): BlockchainParserI<
  SolanaRawTransaction,
  SolanaParsedTransactionV1,
  RawAccountInfo,
  ParsedAccountInfoV1
> => {
  const instructionParserLibrary = new InstructionParserLibrary(layoutPath)
  const accountParserLibrary = new AccountParserLibrary()
  const transactionParser = new TransactionParser(instructionParserLibrary)

  return new SolanaParser(
    instructionParserLibrary,
    accountParserLibrary,
    transactionParser,
  )
}
