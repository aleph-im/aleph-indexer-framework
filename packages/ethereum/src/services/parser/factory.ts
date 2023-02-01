/* eslint-disable prettier/prettier */
import path from 'path'
import { config, Utils } from '@aleph-indexer/core'
import { BlockchainParserI } from '@aleph-indexer/framework'
import { createEthereumClient } from '../../sdk/index.js'
import { EthereumRawTransaction } from '../../types.js'
import { EthereumParser } from './main.js'
import { AbiFactory } from './src/abiFactory.js'
import { EthereumAccountStateParser } from './src/accountStateParser.js'
import { EthereumTransactionParser } from './src/transactionParser.js'
import { EthereumParsedTransaction } from './src/types.js'
import { EthereumLogParser } from './src/logParser.js'

export async function ethereumParserFactory(
  basePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    EthereumRawTransaction,
    EthereumParsedTransaction
  >
> {
  const url = config.ETHEREUM_RPC
  if (!url) throw new Error('ETHEREUM_RPC not configured')

  const abiBasePath = layoutPath || path.join(basePath, 'abi')
  await Utils.ensurePath(abiBasePath)

  const ethereumClient = createEthereumClient(url)
  
  const abiFactory = new AbiFactory(abiBasePath, ethereumClient)
  
  const ethereumAccountStateParser = new EthereumAccountStateParser()
  const ethereumTransactionParser = new EthereumTransactionParser(abiFactory, ethereumClient)
  const ethereumLogParser = new EthereumLogParser(abiFactory, ethereumClient)

  return new EthereumParser(
    ethereumTransactionParser,
    ethereumLogParser,
    ethereumAccountStateParser,
  )
}
