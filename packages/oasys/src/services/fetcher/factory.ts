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
import { OasysClient } from '../../sdk/index.js'

export function oasysClientFetcherFactory(
  blockchainId: BlockchainId,
  config: ReturnType<typeof ethereumConfigFactory>,
  DALs: ReturnType<typeof ethereumDalsFetcherFactory>): OasysClient {
  const url = getBlockchainEnv(blockchainId, 'RPC', true)

  return new OasysClient(
    blockchainId,
    { ...config, url },
    DALs.accountTransactionHistoryDAL,
    DALs.logBloomDAL
  )
}

export async function oasysFetcherFactory(
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

  const oasysClient = oasysClientFetcherFactory(
    blockchainId,
    config,
    DALs
  )

  return ethereumFetcherInstanceFactory(
    blockchainId,
    broker,
    fetcherClient,
    oasysClient,
    config,
    DALs
  )
}
