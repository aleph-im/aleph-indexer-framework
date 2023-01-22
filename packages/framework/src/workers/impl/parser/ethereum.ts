/* eslint-disable prettier/prettier */
import path from 'path'
import { EthereumParsedAccountState, EthereumRawAccountState, EthereumParsedTransaction, EthereumRawTransaction, createEthereumClient, config } from '@aleph-indexer/core'
import { EthereumParser } from '../../../services/parser/src/ethereum/parser.js'
import { EthereumAccountStateParser } from '../../../services/parser/src/ethereum/accountStateParser.js'
import { EthereumTransactionParser } from '../../../services/parser/src/ethereum/transactionParser.js'
import { BlockchainParserI } from '../../../services/parser/src/base/types.js'
import { AbiFactory } from '../../../services/parser/src/ethereum/abiFactory.js'
import { Utils } from '@aleph-indexer/core'

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
  const url = config.ETHEREUM_RPC
  if (!url) throw new Error('ETHEREUM_RPC not configured')

  const abiBasePath = layoutPath || path.join(basePath, 'abi')
  await Utils.ensurePath(abiBasePath)

  const ethereumClient = createEthereumClient(url)
  const abiFactory = new AbiFactory(abiBasePath, ethereumClient)
  const ethereumAccountStateParser = new EthereumAccountStateParser()
  const ethereumTransactionParser = new EthereumTransactionParser(abiFactory, ethereumClient)

  return new EthereumParser(
    ethereumTransactionParser,
    ethereumAccountStateParser,
  )
}
