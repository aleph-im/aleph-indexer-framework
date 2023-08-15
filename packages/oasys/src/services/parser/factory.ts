/* eslint-disable prettier/prettier */
import { BlockchainId, BlockchainParserI, getBlockchainEnv } from '@aleph-indexer/framework'
import {ethereumAbiParserFactory, ethereumParserInstanceFactory } from '@aleph-indexer/ethereum'
import { OasysClient } from '../../sdk/index.js'
import { OasysParsedTransaction, OasysRawTransaction } from './src/types.js'

export function oasysClientParserFactory(
  blockchainId: BlockchainId,
): OasysClient {
  const url = getBlockchainEnv(blockchainId, 'RPC', true)

  return new OasysClient(blockchainId, { url })
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

  const oasysAbiFactory = await ethereumAbiParserFactory(
    blockchainId,
    oasysClient,
    basePath,
    layoutPath
  )

  return ethereumParserInstanceFactory(
    blockchainId,
    oasysClient,
    oasysAbiFactory,
  )
}
