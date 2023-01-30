/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { config, Utils } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  createPendingAccountDAL,
  createRawEntityDAL,
  createAccountStateDAL,
  createFetcherStateDAL,
  createPendingEntityCacheDAL,
  createPendingEntityDAL,
  createPendingEntityFetchDAL,
  FetcherMsClient,
  IndexableEntityType,
  BaseEntityFetcherMain
} from '@aleph-indexer/framework'
import { EthereumFetcher } from './main.js'
import { createEthereumBlockDAL as createEthereumRawBlockDAL } from './src/dal/block.js'
import { createEthereumAccountTransactionHistoryDAL } from './src/dal/accountTransactionHistory.js'
import { EthereumBlockHistoryFetcher } from './src/blockHistoryFetcher.js'
import { EthereumRawTransaction } from '../../types.js'
import { createEthereumClient } from '../../sdk/index.js'
import { EthereumAccountState } from './src/types.js'
import { EthereumTransactionHistoryFetcher } from './src/transactionHistoryFetcher.js'
import { EthereumTransactionFetcher } from './src/transactionFetcher.js'
import { EthereumStateFetcher } from './src/stateFetcher.js'
import { createEthereumLogBloomDAL } from './src/dal/logBloom.js'
import { EthereumLogHistoryFetcher } from './src/logHistoryFetcher.js'
import { createEthereumAccountLogHistoryDAL } from './src/dal/accountLogHistory.js'

export async function ethereumFetcherFactory(
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  const url = config.ETHEREUM_RPC
  if (!url) throw new Error('ETHEREUM_RPC not configured')

  if (basePath) await Utils.ensurePath(basePath)

  // DALs
  const accountSignatureDAL = createEthereumAccountTransactionHistoryDAL(basePath)
  const accountLogDAL = createEthereumAccountLogHistoryDAL(basePath)
  const accountStateDAL = createAccountStateDAL<EthereumAccountState>(basePath, false)
  const blockFetcherHistoryStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_block')
  const transactionHistoryFetcherHistoryStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_transaction_history')
  const logHistoryFetcherHistoryStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_log_history')
  const transactionHistoryPendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_transaction_history')
  const accountStatePendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_account_state')
  const pendingTransactionDAL = createPendingEntityDAL(basePath, IndexableEntityType.Transaction)
  const pendingTransactionCacheDAL = createPendingEntityCacheDAL(basePath, IndexableEntityType.Transaction)
  const pendingTransactionFetchDAL = createPendingEntityFetchDAL(basePath, IndexableEntityType.Transaction)
  const rawTransactionDAL = createRawEntityDAL<EthereumRawTransaction>(basePath, IndexableEntityType.Transaction, false)
  const logBloomDAL = createEthereumLogBloomDAL(basePath)
  const rawBlockDAL = config.ETHEREUM_INDEX_BLOCKS === 'true' ? createEthereumRawBlockDAL(basePath) : undefined

  const ethereumClient = createEthereumClient(url, accountSignatureDAL, logBloomDAL)

  const blockHistoryFetcher = new EthereumBlockHistoryFetcher(
    ethereumClient,
    blockFetcherHistoryStateDAL,
    rawBlockDAL,
  )

  const transactionHistoryFetcher = new EthereumTransactionHistoryFetcher(
    ethereumClient,
    transactionHistoryFetcherHistoryStateDAL,
    blockHistoryFetcher,
    fetcherClient,
    transactionHistoryPendingAccountDAL,
    accountSignatureDAL,
  )

  const transactionFetcher = new EthereumTransactionFetcher(
    ethereumClient,
    broker,
    pendingTransactionDAL,
    pendingTransactionCacheDAL,
    pendingTransactionFetchDAL,
    rawTransactionDAL,
  )

  const logHistoryFetcher = new EthereumLogHistoryFetcher(
    ethereumClient,
    logHistoryFetcherHistoryStateDAL,
    blockHistoryFetcher,
    fetcherClient,
    transactionHistoryPendingAccountDAL,
    accountLogDAL,
  )

  // const accountStateFetcher = new EthereumStateFetcher(
  //   ethereumClient,
  //   accountStateDAL,
  //   accountStatePendingAccountDAL,
  // )

  const transactionFetcherMain = new BaseEntityFetcherMain(
    IndexableEntityType.Transaction,
    transactionFetcher,
    transactionHistoryFetcher,
  )

  const entityFetchers = {
    [IndexableEntityType.Transaction]: transactionFetcherMain,
  }

  return new EthereumFetcher(
    fetcherClient,
    blockHistoryFetcher,
    entityFetchers
  )
}
