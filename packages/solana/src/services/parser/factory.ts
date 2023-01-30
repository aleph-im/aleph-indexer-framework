/* eslint-disable prettier/prettier */
import { Utils } from '@aleph-indexer/core'
import { BlockchainParserI } from '@aleph-indexer/framework'
import { SolanaRawTransaction, SolanaParsedTransaction } from '../../types.js'
import { SolanaParser } from './main.js'
import { SolanaAccountStateParser } from './src/accountState/accountStateParser.js'
import { SolanaInstructionParser } from './src/instruction/instructionParser.js'
import { SolanaTransactionParser } from './src/transaction/transactionParser.js'


export async function solanaParserFactory(
  basePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    SolanaRawTransaction,
    SolanaParsedTransaction
  >
> {
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
