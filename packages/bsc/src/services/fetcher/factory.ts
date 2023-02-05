/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { config, Utils } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  FetcherMsClient,
  IndexableEntityType,
  BaseEntityFetcherMain
} from '@aleph-indexer/framework'
import { ethereumDalsFetcherFactory } from '@aleph-indexer/ethereum'
import { BscFetcher } from './main.js'
import { BscBlockHistoryFetcher } from './src/block/blockHistoryFetcher.js'
import { createBscClient, BscClient } from '../../sdk/index.js'
import { BscTransactionHistoryFetcher } from './src/transaction/transactionHistoryFetcher.js'
import { BscTransactionFetcher } from './src/transaction/transactionFetcher.js'
import { BscLogHistoryFetcher } from './src/log/logHistoryFetcher.js'
import { BscLogFetcher } from './src/log/logFetcher.js'

export  function bscClientFetcherFactory(DALs: ReturnType<typeof ethereumDalsFetcherFactory>): BscClient {
  const url = config.BSC_RPC
  if (!url) throw new Error('BSC_RPC not configured')

  return createBscClient(url, DALs.accountTransactionHistoryDAL, DALs.logBloomDAL)
}

export async function bscFetcherFactory(
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  if (basePath) await Utils.ensurePath(basePath)

  // DALs

  const DALs = ethereumDalsFetcherFactory(basePath)

  // Instances 

  const bscClient = bscClientFetcherFactory(DALs)

  const blockHistoryFetcher = new BscBlockHistoryFetcher(
    bscClient,
    DALs.blockFetcherHistoryStateDAL,
    DALs.rawBlockDAL,
  )

  // Transactions

  const transactionHistoryFetcher = new BscTransactionHistoryFetcher(
    bscClient,
    DALs.transactionHistoryFetcherStateDAL,
    blockHistoryFetcher,
    fetcherClient,
    DALs.transactionHistoryPendingAccountDAL,
    DALs.accountTransactionHistoryDAL,
  )

  const transactionFetcher = new BscTransactionFetcher(
    bscClient,
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

  const logHistoryFetcher = new BscLogHistoryFetcher(
    bscClient,
    DALs.logHistoryFetcherStateDAL,
    blockHistoryFetcher,
    DALs.rawLogDAL,
    fetcherClient,
    DALs.logHistoryPendingAccountDAL,
    DALs.accountLogHistoryDAL,
  )

  const logFetcher = new BscLogFetcher(
    bscClient,
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

  return new BscFetcher(
    fetcherClient,
    blockHistoryFetcher,
    entityFetchers
  )
}
