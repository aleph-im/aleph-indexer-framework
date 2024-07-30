/* eslint-disable prettier/prettier */
import { BlockchainId, BlockchainParserI, getBlockchainEnv } from '@aleph-indexer/framework'
import {ethereumAbiParserFactory, ethereumParserInstanceFactory } from '@aleph-indexer/ethereum'
import { BaseClient } from '../../sdk/index.js'
import { BaseParsedTransaction, BaseRawTransaction } from './src/types.js'

export function baseClientParserFactory(
  blockchainId: BlockchainId,
): BaseClient {
  const url = getBlockchainEnv(blockchainId, 'RPC', true)

  return new BaseClient(blockchainId, { url })
}

export async function baseParserFactory(
  blockchainId: BlockchainId,
  basePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    BaseRawTransaction,
    BaseParsedTransaction
  >
> {
  const baseClient = baseClientParserFactory(blockchainId)

  const baseAbiFactory = await ethereumAbiParserFactory(
    blockchainId,
    baseClient,
    basePath,
    layoutPath
  )

  return ethereumParserInstanceFactory(
    blockchainId,
    baseClient,
    baseAbiFactory,
  )
}
