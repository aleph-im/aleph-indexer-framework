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
import { BaseClient } from '../../sdk/index.js'

export function baseClientFetcherFactory(
  blockchainId: BlockchainId,
  config: ReturnType<typeof ethereumConfigFactory>,
  DALs: ReturnType<typeof ethereumDalsFetcherFactory>): BaseClient {
  const url = getBlockchainEnv(blockchainId, 'RPC', true)

  return new BaseClient(
    blockchainId,
    { ...config, url },
    DALs.accountTransactionHistoryDAL,
    DALs.logBloomDAL
  )
}

export async function baseFetcherFactory(
  blockchainId: BlockchainId,
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  if (basePath) await Utils.ensurePath(basePath)

  // Config

  const config = ethereumConfigFactory(blockchainId)

  // DALs

  const DALs = ethereumDalsFetcherFactory(basePath)

  // Instances 

  const baseClient = baseClientFetcherFactory(
    blockchainId,
    config,
    DALs
  )

  return ethereumFetcherInstanceFactory(
    blockchainId,
    broker,
    fetcherClient,
    baseClient,
    config,
    DALs
  )
}
