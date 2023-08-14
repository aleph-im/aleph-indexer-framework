/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { config, Utils } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  FetcherMsClient,
  BlockchainId
} from '@aleph-indexer/framework'
import { ethereumDalsFetcherFactory, ethereumFetcherInstanceFactory } from '@aleph-indexer/ethereum'
import { BscClient } from '../../sdk/index.js'

export function bscClientFetcherFactory(
  blockchainId: BlockchainId,
  DALs: ReturnType<typeof ethereumDalsFetcherFactory>): BscClient {
  const BLOCKCHAIN_ID = blockchainId.toUpperCase()
  const ENV = `${BLOCKCHAIN_ID}_RPC`

  const url = config[ENV]
  if (!url) throw new Error(`${ENV} not configured`)

  return new BscClient(blockchainId, { url }, DALs.accountTransactionHistoryDAL, DALs.logBloomDAL)
}

export async function bscFetcherFactory(
  blockchainId: BlockchainId,
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  if (basePath) await Utils.ensurePath(basePath)

  // DALs

  const DALs = ethereumDalsFetcherFactory(basePath)

  // Instances 

  const bscClient = bscClientFetcherFactory(blockchainId, DALs)

  return ethereumFetcherInstanceFactory(
    blockchainId,
    broker,
    fetcherClient,
    bscClient,
    DALs
  )
}
