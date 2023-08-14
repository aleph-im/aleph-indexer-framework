/* eslint-disable prettier/prettier */
import path from 'path'
import { config, Utils } from '@aleph-indexer/core'
import { BlockchainId, BlockchainParserI } from '@aleph-indexer/framework'
import { EthereumClient } from '../../sdk/index.js'
import { EthereumRawTransaction } from '../../types.js'
import { EthereumParser } from './main.js'
import { EthereumAbiFactory } from './src/abiFactory.js'
import { EthereumAccountStateParser } from './src/accountStateParser.js'
import { EthereumTransactionParser } from './src/transactionParser.js'
import { EthereumParsedTransaction } from './src/types.js'
import { EthereumLogParser } from './src/logParser.js'

export function ethereumClientParserFactory(
  blockchainId: BlockchainId,
): EthereumClient {
  const BLOCKCHAIN_ID = blockchainId.toUpperCase()
  const ENV = `${BLOCKCHAIN_ID}_RPC`

  const url = config[ENV]
  if (!url) throw new Error(`${ENV} not configured`)

  return new EthereumClient(blockchainId, { url })
}

export async function ethereumAbiParserFactory(
  blockchainId: BlockchainId,
  ethereumClient: EthereumClient,
  basePath: string,
  layoutPath?: string,
): Promise<EthereumAbiFactory> {
  const BLOCKCHAIN_ID = blockchainId.toUpperCase()
  const scanAPIKey = config[`${BLOCKCHAIN_ID}_SCAN_API_KEY`]

  const abiBasePath = layoutPath || path.join(basePath, 'abi')
  await Utils.ensurePath(abiBasePath)

  return new EthereumAbiFactory(blockchainId, abiBasePath, ethereumClient, scanAPIKey)
}

export async function ethereumParserInstanceFactory(
  ethereumClient: EthereumClient,
  abiFactory: EthereumAbiFactory
): Promise<
  BlockchainParserI<
    EthereumRawTransaction,
    EthereumParsedTransaction
  >
> {
  const ethereumAccountStateParser = new EthereumAccountStateParser()
  const ethereumTransactionParser = new EthereumTransactionParser(abiFactory, ethereumClient)
  const ethereumLogParser = new EthereumLogParser(abiFactory, ethereumClient)

  return new EthereumParser(
    ethereumTransactionParser,
    ethereumLogParser,
    ethereumAccountStateParser,
  )
}

export async function ethereumParserFactory(
  blockchainId: BlockchainId,
  basePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    EthereumRawTransaction,
    EthereumParsedTransaction
  >
> {
  const ethereumClient = ethereumClientParserFactory(blockchainId)

  const ethereumAbiFactory = await ethereumAbiParserFactory(
    blockchainId,
    ethereumClient,
    basePath,
    layoutPath
  )

  return ethereumParserInstanceFactory(
    ethereumClient,
    ethereumAbiFactory,
  )
}
