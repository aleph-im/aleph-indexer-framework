/* eslint-disable prettier/prettier */
import path from 'path'
import { config, Utils } from '@aleph-indexer/core'
import { BlockchainParserI } from '@aleph-indexer/framework'
import { AbiFactory } from '@aleph-indexer/ethereum'
import { createBscClient } from '../../sdk/index.js'
import { EthereumRawTransaction } from '../../types.js'
import { BscParser } from './main.js'
import { BscAccountStateParser } from './src/accountStateParser.js'
import { BscTransactionParser } from './src/transactionParser.js'
import { EthereumParsedTransaction } from './src/types.js'
import { BscLogParser } from './src/logParser.js'

export async function bscParserFactory(
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

  const bscClient = createBscClient(url)
  
  const abiFactory = new AbiFactory(abiBasePath, bscClient)
  
  const ethereumAccountStateParser = new BscAccountStateParser()
  const ethereumTransactionParser = new BscTransactionParser(abiFactory, bscClient)
  const ethereumLogParser = new BscLogParser(abiFactory, bscClient)

  return new BscParser(
    ethereumTransactionParser,
    ethereumLogParser,
    ethereumAccountStateParser,
  )
}
