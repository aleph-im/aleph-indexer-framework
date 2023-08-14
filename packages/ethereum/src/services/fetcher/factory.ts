/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { config, Utils } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  createPendingAccountDAL,
  createFetcherStateDAL,
  createPendingEntityCacheDAL,
  createPendingEntityDAL,
  createPendingEntityFetchDAL,
  FetcherMsClient,
  IndexableEntityType,
  BaseEntityFetcherMain,
  BlockchainId
} from '@aleph-indexer/framework'
import { EthereumFetcher } from './main.js'
import { createEthereumRawBlockDAL as createEthereumRawBlockDAL } from './src/block/dal/rawBlock.js'
import { createEthereumAccountTransactionHistoryDAL } from './src/transaction/dal/accountTransactionHistory.js'
import { EthereumBlockHistoryFetcher } from './src/block/blockHistoryFetcher.js'
import { EthereumClient } from '../../sdk/index.js'
import { EthereumTransactionHistoryFetcher } from './src/transaction/transactionHistoryFetcher.js'
import { EthereumTransactionFetcher } from './src/transaction/transactionFetcher.js'
import { createEthereumLogBloomDAL } from './src/log/dal/logBloom.js'
import { EthereumLogHistoryFetcher } from './src/log/logHistoryFetcher.js'
import { createEthereumAccountLogHistoryDAL } from './src/log/dal/accountLogHistory.js'
import { EthereumLogFetcher } from './src/log/logFetcher.js'
import { createEthereumRawLogDAL } from './src/log/dal/rawLog.js'
import { createEthereumRawTransactionDAL } from './src/transaction/dal/rawTransaction.js'


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function ethereumDalsFetcherFactory(basePath: string) {
  return {
    blockFetcherHistoryStateDAL: createFetcherStateDAL(basePath, 'fetcher_state_block'),
    logBloomDAL: createEthereumLogBloomDAL(basePath),
    rawBlockDAL: createEthereumRawBlockDAL(basePath),

    accountTransactionHistoryDAL: createEthereumAccountTransactionHistoryDAL(basePath),
    transactionHistoryFetcherStateDAL: createFetcherStateDAL(basePath, 'fetcher_state_transaction_history'),
    transactionHistoryPendingAccountDAL: createPendingAccountDAL(basePath, 'fetcher_pending_account_transaction_history'),
    pendingTransactionDAL: createPendingEntityDAL(basePath, IndexableEntityType.Transaction),
    pendingTransactionCacheDAL: createPendingEntityCacheDAL(basePath, IndexableEntityType.Transaction),
    pendingTransactionFetchDAL: createPendingEntityFetchDAL(basePath, IndexableEntityType.Transaction),
    rawTransactionDAL: createEthereumRawTransactionDAL(basePath),

    accountLogHistoryDAL: createEthereumAccountLogHistoryDAL(basePath),
    logHistoryFetcherStateDAL: createFetcherStateDAL(basePath, 'fetcher_state_log_history'),
    logHistoryPendingAccountDAL: createPendingAccountDAL(basePath, 'fetcher_pending_account_log_history'),
    pendingLogDAL: createPendingEntityDAL(basePath, IndexableEntityType.Log),
    pendingLogCacheDAL: createPendingEntityCacheDAL(basePath, IndexableEntityType.Log),
    pendingLogFetchDAL: createPendingEntityFetchDAL(basePath, IndexableEntityType.Log),
    rawLogDAL: createEthereumRawLogDAL(basePath),
  }
}

export function ethereumClientFetcherFactory(
  blockchainId: BlockchainId,
  DALs: ReturnType<typeof ethereumDalsFetcherFactory>,
): EthereumClient {
  const BLOCKCHAIN_ID = blockchainId.toUpperCase()
  const ENV = `${BLOCKCHAIN_ID}_RPC`

  const url = config[ENV]
  if (!url) throw new Error(`${ENV} not configured`)

  return new EthereumClient(blockchainId, { url }, DALs.accountTransactionHistoryDAL, DALs.logBloomDAL)
}

// @todo: Refactor and pass the vars through SDK.init extended config
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function ethereumConfigFactory(blockchainId: BlockchainId) {
  const BLOCKCHAIN_ID = blockchainId.toUpperCase()

  return {
    indexRawBlocks: config[`${BLOCKCHAIN_ID}_INDEX_BLOCKS`] === 'true', // default false
    indexAccountTransactionHistory: config[`${BLOCKCHAIN_ID}_INDEX_TRANSACTIONS`] !== 'false', // default true
    indexAccountLogHistory: config[`${BLOCKCHAIN_ID}_INDEX_LOGS`] !== 'false', // default true
  }
}

export function ethereumFetcherInstanceFactory(
  blockchainId: BlockchainId,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
  ethereumClient: EthereumClient,
  DALs: ReturnType<typeof ethereumDalsFetcherFactory>,
): EthereumFetcher {

  const config = ethereumConfigFactory(blockchainId)

  const blockHistoryFetcher = new EthereumBlockHistoryFetcher(
    blockchainId,
    config,
    ethereumClient,
    DALs.blockFetcherHistoryStateDAL,
    DALs.rawBlockDAL,
  )

  // Transactions

  const transactionHistoryFetcher = new EthereumTransactionHistoryFetcher(
    blockchainId,
    ethereumClient,
    DALs.transactionHistoryFetcherStateDAL,
    blockHistoryFetcher,
    fetcherClient,
    DALs.transactionHistoryPendingAccountDAL,
    DALs.accountTransactionHistoryDAL,
  )

  const transactionFetcher = new EthereumTransactionFetcher(
    blockchainId,
    ethereumClient,
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

  const logHistoryFetcher = new EthereumLogHistoryFetcher(
    blockchainId,
    ethereumClient,
    DALs.logHistoryFetcherStateDAL,
    blockHistoryFetcher,
    DALs.rawLogDAL,
    fetcherClient,
    DALs.logHistoryPendingAccountDAL,
    DALs.accountLogHistoryDAL,
  )

  const logFetcher = new EthereumLogFetcher(
    blockchainId,
    ethereumClient,
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

  return new EthereumFetcher(
    blockchainId,
    fetcherClient,
    blockHistoryFetcher,
    entityFetchers
  )
}

export async function ethereumFetcherFactory(
  blockchainId: BlockchainId,
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  if (basePath) await Utils.ensurePath(basePath)

  // DALs

  const DALs = ethereumDalsFetcherFactory(basePath)

  // Instances 

  const ethereumClient = ethereumClientFetcherFactory(blockchainId, DALs)

  return ethereumFetcherInstanceFactory(
    blockchainId,
    broker,
    fetcherClient,
    ethereumClient,
    DALs
  )
}
