/* eslint-disable prettier/prettier */
import path from 'path'
import { Utils } from '@aleph-indexer/core'
import { BlockchainId, BlockchainParserI, getBlockchainEnv } from '@aleph-indexer/framework'
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
  const url = getBlockchainEnv(blockchainId, 'RPC', true)

  return new EthereumClient(blockchainId, { url })
}

export async function ethereumAbiParserFactory(
  blockchainId: BlockchainId,
  ethereumClient: EthereumClient,
  basePath: string,
  layoutPath?: string,
): Promise<EthereumAbiFactory> {
  const explorerURL = getBlockchainEnv(blockchainId, 'EXPLORER_URL', true)

  const abiBasePath = layoutPath || path.join(basePath, 'abi')
  await Utils.ensurePath(abiBasePath)

  return new EthereumAbiFactory(
    blockchainId,
    abiBasePath,
    ethereumClient,
    explorerURL
  )
}

export async function ethereumParserInstanceFactory(
  blockchainId: BlockchainId,
  ethereumClient: EthereumClient,
  abiFactory: EthereumAbiFactory
): Promise<
  BlockchainParserI<
    EthereumRawTransaction,
    EthereumParsedTransaction
  >
> {
  const ethereumAccountStateParser = new EthereumAccountStateParser()
  const ethereumTransactionParser = new EthereumTransactionParser(blockchainId, abiFactory, ethereumClient)
  const ethereumLogParser = new EthereumLogParser(blockchainId, abiFactory, ethereumClient)

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
    blockchainId,
    ethereumClient,
    ethereumAbiFactory,
  )
}
