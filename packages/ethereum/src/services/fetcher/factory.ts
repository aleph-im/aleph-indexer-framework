/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { Utils } from '@aleph-indexer/core'
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
  BlockchainId,
  getBlockchainEnv
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
  config: ReturnType<typeof ethereumConfigFactory>,
  DALs: ReturnType<typeof ethereumDalsFetcherFactory>,
): EthereumClient {
  const url = getBlockchainEnv(blockchainId, 'RPC', true)

  return new EthereumClient(
    blockchainId,
    { ...config, url },
    DALs.accountTransactionHistoryDAL,
    DALs.logBloomDAL
  )
}

// @todo: Refactor and pass the vars through SDK.init extended config
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function ethereumConfigFactory(blockchainId: BlockchainId) {
  const indexRawBlocks = getBlockchainEnv(blockchainId, 'INDEX_BLOCKS', false) === 'true'
  const indexAccountTransactionHistory = getBlockchainEnv(blockchainId, 'INDEX_TRANSACTIONS', false) !== 'false'
  const indexAccountLogHistory = getBlockchainEnv(blockchainId, 'INDEX_LOGS', false) !== 'false'

  return {
    indexRawBlocks, // default false
    indexAccountTransactionHistory, // default true
    indexAccountLogHistory, // default true
  }
}

export function ethereumFetcherInstanceFactory(
  blockchainId: BlockchainId,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
  ethereumClient: EthereumClient,
  config: ReturnType<typeof ethereumConfigFactory>,
  DALs: ReturnType<typeof ethereumDalsFetcherFactory>,
  blockHistoryFetcher?: EthereumBlockHistoryFetcher,
  logHistoryFetcher?: EthereumLogHistoryFetcher
): EthereumFetcher {


  blockHistoryFetcher = blockHistoryFetcher || new EthereumBlockHistoryFetcher(
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

   logHistoryFetcher = logHistoryFetcher || new EthereumLogHistoryFetcher(
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

  // Config

  const config = ethereumConfigFactory(blockchainId)

  // DALs

  const DALs = ethereumDalsFetcherFactory(basePath)

  // Instances 

  const ethereumClient = ethereumClientFetcherFactory(
    blockchainId,
    config,
    DALs
  )

  return ethereumFetcherInstanceFactory(
    blockchainId,
    broker,
    fetcherClient,
    ethereumClient,
    config,
    DALs
  )
}
