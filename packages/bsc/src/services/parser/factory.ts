/* eslint-disable prettier/prettier */
import path from 'path'
import { config, Utils } from '@aleph-indexer/core'
import { BlockchainParserI } from '@aleph-indexer/framework'
import { EthereumRawTransaction } from '@aleph-indexer/ethereum'
import { BscClient, createBscClient } from '../../sdk/index.js'
import { BscParser } from './main.js'
import { BscAccountStateParser } from './src/accountStateParser.js'
import { BscTransactionParser } from './src/transactionParser.js'
import { BscParsedTransaction } from './src/types.js'
import { BscLogParser } from './src/logParser.js'
import { BscAbiFactory } from './src/abiFactory.js'

export  function bscClientParserFactory(): BscClient {
  const url = config.BSC_RPC
  if (!url) throw new Error('BSC_RPC not configured')

  return createBscClient(url)
}

export async function bscParserFactory(
  basePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    EthereumRawTransaction,
    BscParsedTransaction
  >
> {
  const abiBasePath = layoutPath || path.join(basePath, 'abi')
  await Utils.ensurePath(abiBasePath)

  const bscClient = bscClientParserFactory()
  
  const abiFactory = new BscAbiFactory(abiBasePath, bscClient)
  
  const bscAccountStateParser = new BscAccountStateParser()
  const bscTransactionParser = new BscTransactionParser(abiFactory, bscClient)
  const bscLogParser = new BscLogParser(abiFactory, bscClient)

  return new BscParser(
    bscTransactionParser,
    bscLogParser,
    bscAccountStateParser,
  )
}
