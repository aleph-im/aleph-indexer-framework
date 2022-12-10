import { ServiceBroker } from 'moleculer'
import {
  createFetcherStateDAL,
  createEthereumClient,
  config,
} from '@aleph-indexer/core'
import { EthereumFetcher } from '../../../services/fetcher/src/ethereum/fetcher.js'
import { BlockchainFetcherI } from '../../../services/fetcher/src/blockchainFetcher.js'
import { createEthereumBlockDAL } from '../../../services/fetcher/src/ethereum/dal/block.js'

export default (
  broker: ServiceBroker,
  basePath: string,
): BlockchainFetcherI => {
  const url = config.ETHEREUM_RPC

  if (!url) throw new Error('ETHEREUM_RPC not configured')

  return new EthereumFetcher(
    broker,
    createEthereumClient(url, basePath),
    createEthereumBlockDAL(basePath),
    createFetcherStateDAL(basePath),
  )
}
