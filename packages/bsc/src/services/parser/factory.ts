/* eslint-disable prettier/prettier */
import path from 'path'
import { config, Utils } from '@aleph-indexer/core'
import { BlockchainId, BlockchainParserI } from '@aleph-indexer/framework'
import {ethereumParserInstanceFactory } from '@aleph-indexer/ethereum'
import { BscClient } from '../../sdk/index.js'
import { BscParsedTransaction, BscRawTransaction } from './src/types.js'
import { BscAbiFactory } from './src/abiFactory.js'

export function bscClientParserFactory(
  blockchainId: BlockchainId,
): BscClient {
  const BLOCKCHAIN_ID = blockchainId.toUpperCase()
  const ENV = `${BLOCKCHAIN_ID}_RPC`

  const url = config[ENV]
  if (!url) throw new Error(`${ENV} not configured`)

  return new BscClient(blockchainId, { url })
}

export async function bscAbiParserFactory(
  blockchainId: BlockchainId,
  bscClient: BscClient,
  basePath: string,
  layoutPath?: string,
): Promise<BscAbiFactory> {
  const BLOCKCHAIN_ID = blockchainId.toUpperCase()
  const scanAPIKey = config[`${BLOCKCHAIN_ID}_SCAN_API_KEY`]

  const abiBasePath = layoutPath || path.join(basePath, 'abi')
  await Utils.ensurePath(abiBasePath)

  return new BscAbiFactory(blockchainId, abiBasePath, bscClient, scanAPIKey)
}

export async function bscParserFactory(
  blockchainId: BlockchainId,
  basePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    BscRawTransaction,
    BscParsedTransaction
  >
> {
  const bscClient = bscClientParserFactory(blockchainId)

  const bscAbiFactory = await bscAbiParserFactory(
    blockchainId,
    bscClient,
    basePath,
    layoutPath
  )

  return ethereumParserInstanceFactory(
    bscClient,
    bscAbiFactory,
  )
}
