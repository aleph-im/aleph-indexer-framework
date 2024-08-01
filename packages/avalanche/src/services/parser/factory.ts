/* eslint-disable prettier/prettier */
import { BlockchainId, BlockchainParserI, getBlockchainEnv } from '@aleph-indexer/framework'
import {ethereumAbiParserFactory, ethereumParserInstanceFactory } from '@aleph-indexer/ethereum'
import { AvalancheClient } from '../../sdk/index.js'
import { AvalancheParsedTransaction, AvalancheRawTransaction } from './src/types.js'

export function avalancheClientParserFactory(
  blockchainId: BlockchainId,
): AvalancheClient {
  const url = getBlockchainEnv(blockchainId, 'RPC', true)

  return new AvalancheClient(blockchainId, { url })
}

export async function avalancheParserFactory(
  blockchainId: BlockchainId,
  avalanchePath: string,
  layoutPath?: string,
): Promise<
  BlockchainParserI<
    AvalancheRawTransaction,
    AvalancheParsedTransaction
  >
> {
  const avalancheClient = avalancheClientParserFactory(blockchainId)

  const avalancheAbiFactory = await ethereumAbiParserFactory(
    blockchainId,
    avalancheClient,
    avalanchePath,
    layoutPath
  )

  return ethereumParserInstanceFactory(
    blockchainId,
    avalancheClient,
    avalancheAbiFactory,
  )
}
