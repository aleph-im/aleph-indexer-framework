/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { config, Utils } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  FetcherMsClient,
  IndexableEntityType,
  BaseEntityFetcherMain,
  Blockchain
} from '@aleph-indexer/framework'
import { ethereumDalsFetcherFactory, ethereumConfigFactory } from '@aleph-indexer/ethereum'
import { OasysFetcher } from './main.js'
import { OasysBlockHistoryFetcher } from './src/block/blockHistoryFetcher.js'
import { createOasysClient, OasysClient } from '../../sdk/index.js'
import { OasysTransactionHistoryFetcher } from './src/transaction/transactionHistoryFetcher.js'
import { OasysTransactionFetcher } from './src/transaction/transactionFetcher.js'
import { OasysLogHistoryFetcher } from './src/log/logHistoryFetcher.js'
import { OasysLogFetcher } from './src/log/logFetcher.js'

export function oasysClientFetcherFactory(DALs: ReturnType<typeof ethereumDalsFetcherFactory>): OasysClient {
  const url = config.BSC_RPC
  if (!url) throw new Error('BSC_RPC not configured')

  return createOasysClient(url, DALs.accountTransactionHistoryDAL, DALs.logBloomDAL)
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function oasysConfigFactory() {
  return ethereumConfigFactory(Blockchain.Oasys)
}

export async function oasysFetcherFactory(
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  if (basePath) await Utils.ensurePath(basePath)

  // DALs

  const DALs = ethereumDalsFetcherFactory(basePath)

  // Instances 

  const oasysClient = oasysClientFetcherFactory(DALs)

  const config = oasysConfigFactory()

  const blockHistoryFetcher = new OasysBlockHistoryFetcher(
    config,
    oasysClient,
    DALs.blockFetcherHistoryStateDAL,
    DALs.rawBlockDAL,
  )

  // Transactions

  const transactionHistoryFetcher = new OasysTransactionHistoryFetcher(
    oasysClient,
    DALs.transactionHistoryFetcherStateDAL,
    blockHistoryFetcher,
    fetcherClient,
    DALs.transactionHistoryPendingAccountDAL,
    DALs.accountTransactionHistoryDAL,
  )

  const transactionFetcher = new OasysTransactionFetcher(
    oasysClient,
    broker,
    DALs.pendingTransactionDAL,
    DALs.pendingTransactionCacheDAL,
    DALs.pendingTransactionFetchDAL,
    DALs.rawTransactionDAL,
  )

  const transactionFetcherMain = new BaseEntityFetcherMain(
    IndexableEntityType.Transaction,
    transactionFetcher,
    transactionHistoryFetcher,
  )

  // Logs

  const logHistoryFetcher = new OasysLogHistoryFetcher(
    oasysClient,
    DALs.logHistoryFetcherStateDAL,
    blockHistoryFetcher,
    DALs.rawLogDAL,
    fetcherClient,
    DALs.logHistoryPendingAccountDAL,
    DALs.accountLogHistoryDAL,
  )

  const logFetcher = new OasysLogFetcher(
    oasysClient,
    broker,
    DALs.pendingLogDAL,
    DALs.pendingLogCacheDAL,
    DALs.pendingLogFetchDAL,
    DALs.rawLogDAL,
  )

  const logFetcherMain = new BaseEntityFetcherMain(
    IndexableEntityType.Log,
    logFetcher,
    logHistoryFetcher,
  )

  // Entity Fetchers

  const entityFetchers = {
    [IndexableEntityType.Transaction]: transactionFetcherMain,
    [IndexableEntityType.Log]: logFetcherMain,
  }

  // Main service

  return new OasysFetcher(
    fetcherClient,
    blockHistoryFetcher,
    entityFetchers
  )
}
