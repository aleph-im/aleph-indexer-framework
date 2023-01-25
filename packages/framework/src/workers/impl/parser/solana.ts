/* eslint-disable prettier/prettier */
import {  Utils } from '@aleph-indexer/core'
import { SolanaParser } from '../../../services/parser/src/solana/parser.js'
import { SolanaTransactionParser } from '../../../services/parser/src/solana/transaction/transactionParser.js'
import { SolanaInstructionParser } from '../../../services/parser/src/solana/instruction/instructionParser.js'
import { SolanaAccountStateParser } from '../../../services/parser/src/solana/accountState/accountStateParser.js'
import { BlockchainParserI } from '../../../services/parser/src/base/types.js'
import { ParsedAccountInfoV1, RawAccountInfo, SolanaParsedTransaction, SolanaRawTransaction } from '../../../types/solana.js'

export default async (
  basePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    SolanaRawTransaction,
    SolanaParsedTransaction,
    RawAccountInfo,
    ParsedAccountInfoV1
  >
> => {
  const layoutBasePath = layoutPath // || path.join(basePath, 'layout')
  if (layoutBasePath) await Utils.ensurePath(layoutBasePath)

  const solanaInstructionParser = new SolanaInstructionParser(layoutBasePath)
  const solanaTransactionParser = new SolanaTransactionParser(solanaInstructionParser)
  const solanaAccountStateParser = new SolanaAccountStateParser()

  return new SolanaParser(
    solanaInstructionParser,
    solanaTransactionParser,
    solanaAccountStateParser,
  )
}
