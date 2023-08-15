/* eslint-disable prettier/prettier */
import { BlockchainId, BlockchainParserI, getBlockchainEnv } from '@aleph-indexer/framework'
import {ethereumAbiParserFactory, ethereumParserInstanceFactory } from '@aleph-indexer/ethereum'
import { BscClient } from '../../sdk/index.js'
import { BscParsedTransaction, BscRawTransaction } from './src/types.js'

export function bscClientParserFactory(
  blockchainId: BlockchainId,
): BscClient {
  const url = getBlockchainEnv(blockchainId, 'RPC', true)

  return new BscClient(blockchainId, { url })
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

  const bscAbiFactory = await ethereumAbiParserFactory(
    blockchainId,
    bscClient,
    basePath,
    layoutPath
  )

  return ethereumParserInstanceFactory(
    blockchainId,
    bscClient,
    bscAbiFactory,
  )
}
