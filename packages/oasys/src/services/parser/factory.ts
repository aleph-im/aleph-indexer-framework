/* eslint-disable prettier/prettier */
import path from 'path'
import { config, Utils } from '@aleph-indexer/core'
import { BlockchainId, BlockchainParserI } from '@aleph-indexer/framework'
import {ethereumParserInstanceFactory } from '@aleph-indexer/ethereum'
import { OasysClient } from '../../sdk/index.js'
import { OasysParsedTransaction, OasysRawTransaction } from './src/types.js'
import { OasysAbiFactory } from './src/abiFactory.js'

export function oasysClientParserFactory(
  blockchainId: BlockchainId,
): OasysClient {
  const BLOCKCHAIN_ID = blockchainId.toUpperCase()
  const ENV = `${BLOCKCHAIN_ID}_RPC`

  const url = config[ENV]
  if (!url) throw new Error(`${ENV} not configured`)

  return new OasysClient(blockchainId, { url })
}

export async function oasysAbiParserFactory(
  blockchainId: BlockchainId,
  oasysClient: OasysClient,
  basePath: string,
  layoutPath?: string,
): Promise<OasysAbiFactory> {
  const abiBasePath = layoutPath || path.join(basePath, 'abi')
  await Utils.ensurePath(abiBasePath)

  return new OasysAbiFactory(blockchainId, abiBasePath, oasysClient, undefined)
}

export async function oasysParserFactory(
  blockchainId: BlockchainId,
  basePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    OasysRawTransaction,
    OasysParsedTransaction
  >
> {
  const oasysClient = oasysClientParserFactory(blockchainId)

  const oasysAbiFactory = await oasysAbiParserFactory(
    blockchainId,
    oasysClient,
    basePath,
    layoutPath
  )

  return ethereumParserInstanceFactory(
    oasysClient,
    oasysAbiFactory,
  )
}
