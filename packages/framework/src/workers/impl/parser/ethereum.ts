/* eslint-disable prettier/prettier */
import { EthereumParsedAccountState, EthereumRawAccountState, EthereumParsedTransaction, EthereumRawTransaction } from '@aleph-indexer/core'
import { EthereumParser } from '../../../services/parser/src/ethereum/parser.js'
import { EthereumAccountStateParser } from '../../../services/parser/src/ethereum/accountStateParser.js'
import { EthereumTransactionParser } from '../../../services/parser/src/ethereum/transactionParser.js'
import { BlockchainParserI } from '../../../services/parser/src/base/types.js'

export default async (
  basePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    EthereumRawTransaction,
    EthereumParsedTransaction,
    EthereumRawAccountState,
    EthereumParsedAccountState
  >
> => {
  const ethereumAccountStateParser = new EthereumAccountStateParser()
  const ethereumTransactionParser = new EthereumTransactionParser()

  return new EthereumParser(
    ethereumTransactionParser,
    ethereumAccountStateParser,
  )
}
