/* eslint-disable prettier/prettier */
import path from 'path'
import { config, Utils } from '@aleph-indexer/core'
import { BlockchainParserI } from '@aleph-indexer/framework'
import { OasysClient, createOasysClient } from '../../sdk/index.js'
import { OasysParser } from './main.js'
import { OasysAccountStateParser } from './src/accountStateParser.js'
import { OasysTransactionParser } from './src/transactionParser.js'
import { OasysParsedTransaction, OasysRawTransaction } from './src/types.js'
import { OasysLogParser } from './src/logParser.js'
import { OasysAbiFactory } from './src/abiFactory.js'

export  function oasysClientParserFactory(): OasysClient {
  const url = config.BSC_RPC
  if (!url) throw new Error('BSC_RPC not configured')

  return createOasysClient(url)
}

export async function oasysParserFactory(
  basePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    OasysRawTransaction,
    OasysParsedTransaction
  >
> {
  const abiBasePath = layoutPath || path.join(basePath, 'abi')
  await Utils.ensurePath(abiBasePath)

  const oasysClient = oasysClientParserFactory()
  
  const abiFactory = new OasysAbiFactory(abiBasePath, oasysClient)
  
  const oasysAccountStateParser = new OasysAccountStateParser()
  const oasysTransactionParser = new OasysTransactionParser(abiFactory, oasysClient)
  const oasysLogParser = new OasysLogParser(abiFactory, oasysClient)

  return new OasysParser(
    oasysTransactionParser,
    oasysLogParser,
    oasysAccountStateParser,
  )
}
