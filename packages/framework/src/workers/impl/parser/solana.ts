/* eslint-disable prettier/prettier */
import { ParsedAccountInfoV1, RawAccountInfo, SolanaParsedTransactionV1, SolanaRawTransaction } from '@aleph-indexer/core'
import { SolanaParser } from '../../../services/parser/src/solana/parser.js'
import { SolanaTransactionParser } from '../../../services/parser/src/solana/transaction/transactionParser.js'
import { SolanaInstructionParser } from '../../../services/parser/src/solana/instruction/instructionParser.js'
import { SolanaAccountStateParser } from '../../../services/parser/src/solana/accountState/accountStateParser.js'
import { BlockchainParserI } from '../../../services/parser/src/base/types.js'

export default async (
  basePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    SolanaRawTransaction,
    SolanaParsedTransactionV1,
    RawAccountInfo,
    ParsedAccountInfoV1
  >
> => {
  const solanaInstructionParser = new SolanaInstructionParser(layoutPath)
  const solanaTransactionParser = new SolanaTransactionParser(solanaInstructionParser)
  const solanaAccountStateParser = new SolanaAccountStateParser()

  return new SolanaParser(
    solanaInstructionParser,
    solanaTransactionParser,
    solanaAccountStateParser,
  )
}
