/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { config, Utils } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  FetcherMsClient,
  BlockchainId
} from '@aleph-indexer/framework'
import { ethereumDalsFetcherFactory, ethereumFetcherInstanceFactory } from '@aleph-indexer/ethereum'
import { OasysClient } from '../../sdk/index.js'

export function oasysClientFetcherFactory(
  blockchainId: BlockchainId,
  DALs: ReturnType<typeof ethereumDalsFetcherFactory>): OasysClient {
  const BLOCKCHAIN_ID = blockchainId.toUpperCase()
  const ENV = `${BLOCKCHAIN_ID}_RPC`

  const url = config[ENV]
  if (!url) throw new Error(`${ENV} not configured`)

  return new OasysClient(blockchainId, { url }, DALs.accountTransactionHistoryDAL, DALs.logBloomDAL)
}

export async function oasysFetcherFactory(
  blockchainId: BlockchainId,
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  if (basePath) await Utils.ensurePath(basePath)

  // DALs

  const DALs = ethereumDalsFetcherFactory(basePath)

  // Instances 

  const oasysClient = oasysClientFetcherFactory(blockchainId, DALs)

  return ethereumFetcherInstanceFactory(
    blockchainId,
    broker,
    fetcherClient,
    oasysClient,
    DALs
  )
}
