/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { Utils } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  FetcherMsClient,
  BlockchainId,
  getBlockchainEnv
} from '@aleph-indexer/framework'
import { ethereumConfigFactory, ethereumDalsFetcherFactory, ethereumFetcherInstanceFactory } from '@aleph-indexer/ethereum'
import { AvalancheClient } from '../../sdk/index.js'
import { AvalancheBlockHistoryFetcher } from './src/block/blockHistoryFetcher.js'
import { AvalancheLogHistoryFetcher } from './src/log/logHistoryFetcher.js'

export function avalancheClientFetcherFactory(
  blockchainId: BlockchainId,
  config: ReturnType<typeof ethereumConfigFactory>,
  DALs: ReturnType<typeof ethereumDalsFetcherFactory>): AvalancheClient {
  const url = getBlockchainEnv(blockchainId, 'RPC', true)

  return new AvalancheClient(
    blockchainId,
    { ...config, url },
    DALs.accountTransactionHistoryDAL,
    DALs.logBloomDAL
  )
}

export async function avalancheFetcherFactory(
  blockchainId: BlockchainId,
  avalanchePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  if (avalanchePath) await Utils.ensurePath(avalanchePath)

  // Config

  const config = ethereumConfigFactory(blockchainId)

  // DALs

  const DALs = ethereumDalsFetcherFactory(avalanchePath)

  // Instances 

  const avalancheClient = avalancheClientFetcherFactory(
    blockchainId,
    config,
    DALs
  )

  // @note: to set block batch size to 45 instead of 50 (50 fails in most of the RPCs)
  // @todo: Make it configurable by env var
  const blockHistoryFetcher = new AvalancheBlockHistoryFetcher(
    blockchainId,
    config,
    avalancheClient,
    DALs.blockFetcherHistoryStateDAL,
    DALs.rawBlockDAL,
  )

  // @note: to set block batch size to 45 instead of 50 (50 fails in most of the RPCs)
  // Error: requested too many blocks from 48665361 to 48668294, maximum is set to 2048
  // @todo: Make it configurable by env var
  const logHistoryFetcher = new AvalancheLogHistoryFetcher(
    blockchainId,
    avalancheClient,
    DALs.logHistoryFetcherStateDAL,
    blockHistoryFetcher,
    DALs.rawLogDAL,
    fetcherClient,
    DALs.logHistoryPendingAccountDAL,
    DALs.accountLogHistoryDAL,
  )

  return ethereumFetcherInstanceFactory(
    blockchainId,
    broker,
    fetcherClient,
    avalancheClient,
    config,
    DALs,
    blockHistoryFetcher,
    logHistoryFetcher
  )
}
