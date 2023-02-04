/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { config, Utils } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  createPendingAccountDAL,
  createRawEntityDAL,
  createFetcherStateDAL,
  createPendingEntityCacheDAL,
  createPendingEntityDAL,
  createPendingEntityFetchDAL,
  FetcherMsClient,
  IndexableEntityType,
  BaseEntityFetcherMain
} from '@aleph-indexer/framework'
import { EthereumFetcher } from './main.js'
import { createEthereumRawBlockDAL as createEthereumRawBlockDAL } from './src/block/dal/rawBlock.js'
import { createEthereumAccountTransactionHistoryDAL } from './src/transaction/dal/accountTransactionHistory.js'
import { EthereumBlockHistoryFetcher } from './src/block/blockHistoryFetcher.js'
import { createEthereumClient } from '../../sdk/index.js'
import { EthereumTransactionHistoryFetcher } from './src/transaction/transactionHistoryFetcher.js'
import { EthereumTransactionFetcher } from './src/transaction/transactionFetcher.js'
import { createEthereumLogBloomDAL } from './src/log/dal/logBloom.js'
import { EthereumLogHistoryFetcher } from './src/log/logHistoryFetcher.js'
import { createEthereumAccountLogHistoryDAL } from './src/log/dal/accountLogHistory.js'
import { EthereumLogFetcher } from './src/log/logFetcher.js'
import { createEthereumRawLogDAL } from './src/log/dal/rawLog.js'
import { createEthereumRawTransactionDAL } from './src/transaction/dal/rawTransaction.js'

export async function ethereumFetcherFactory(
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  const url = config.ETHEREUM_RPC
  if (!url) throw new Error('ETHEREUM_RPC not configured')

  if (basePath) await Utils.ensurePath(basePath)

  // DALs

  const blockFetcherHistoryStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_block')
  const logBloomDAL = createEthereumLogBloomDAL(basePath)
  const rawBlockDAL = config.ETHEREUM_INDEX_BLOCKS === 'true' ? createEthereumRawBlockDAL(basePath) : undefined

  const accountTransactionHistoryDAL = createEthereumAccountTransactionHistoryDAL(basePath)
  const transactionHistoryFetcherStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_transaction_history')
  const transactionHistoryPendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_transaction_history')
  const pendingTransactionDAL = createPendingEntityDAL(basePath, IndexableEntityType.Transaction)
  const pendingTransactionCacheDAL = createPendingEntityCacheDAL(basePath, IndexableEntityType.Transaction)
  const pendingTransactionFetchDAL = createPendingEntityFetchDAL(basePath, IndexableEntityType.Transaction)
  const rawTransactionDAL = createEthereumRawTransactionDAL(basePath)

  const accountLogHistoryDAL = createEthereumAccountLogHistoryDAL(basePath)
  const logHistoryFetcherStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_log_history')
  const logHistoryPendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_log_history')
  const pendingLogDAL = createPendingEntityDAL(basePath, IndexableEntityType.Log)
  const pendingLogCacheDAL = createPendingEntityCacheDAL(basePath, IndexableEntityType.Log)
  const pendingLogFetchDAL = createPendingEntityFetchDAL(basePath, IndexableEntityType.Log)
  const rawLogDAL = createEthereumRawLogDAL(basePath)

  // Instances 

  const ethereumClient = createEthereumClient(url, accountTransactionHistoryDAL, logBloomDAL)

  const blockHistoryFetcher = new EthereumBlockHistoryFetcher(
    ethereumClient,
    blockFetcherHistoryStateDAL,
    rawBlockDAL,
  )

  // Transactions

  const transactionHistoryFetcher = new EthereumTransactionHistoryFetcher(
    ethereumClient,
    transactionHistoryFetcherStateDAL,
    blockHistoryFetcher,
    fetcherClient,
    transactionHistoryPendingAccountDAL,
    accountTransactionHistoryDAL,
  )

  const transactionFetcher = new EthereumTransactionFetcher(
    ethereumClient,
    broker,
    pendingTransactionDAL,
    pendingTransactionCacheDAL,
    pendingTransactionFetchDAL,
    rawTransactionDAL,
  )

  const transactionFetcherMain = new BaseEntityFetcherMain(
    IndexableEntityType.Transaction,
    transactionFetcher,
    transactionHistoryFetcher,
  )

  // Logs

  const logHistoryFetcher = new EthereumLogHistoryFetcher(
    ethereumClient,
    logHistoryFetcherStateDAL,
    blockHistoryFetcher,
    rawLogDAL,
    fetcherClient,
    logHistoryPendingAccountDAL,
    accountLogHistoryDAL,
  )

  const logFetcher = new EthereumLogFetcher(
    ethereumClient,
    broker,
    pendingLogDAL,
    pendingLogCacheDAL,
    pendingLogFetchDAL,
    rawLogDAL,
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

  return new EthereumFetcher(
    fetcherClient,
    blockHistoryFetcher,
    entityFetchers
  )
}
