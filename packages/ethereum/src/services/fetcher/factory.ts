/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { config, Utils } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  createPendingAccountDAL,
  createRawTransactionDAL,
  createAccountStateDAL,
  createFetcherStateDAL,
  createPendingTransactionCacheDAL,
  createPendingTransactionDAL,
  createPendingTransactionFetchDAL,
  FetcherMsClient
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

export async function ethereumFetcherFactory(
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  const url = config.ETHEREUM_RPC
  if (!url) throw new Error('ETHEREUM_RPC not configured')

  if (basePath) await Utils.ensurePath(basePath)

  // DALs
  const rawBlockDAL = createEthereumRawBlockDAL(basePath)
  const accountSignatureDAL = createEthereumAccountTransactionHistoryDAL(basePath)
  const accountStateDAL = createAccountStateDAL<EthereumAccountState>(basePath, false)
  const blockFetcherHistoryStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_block')
  const transactionHistoryFetcherHistoryStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_transaction_history')
  const transactionHistoryPendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_transaction_history')
  const accountStatePendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_account_state')
  const pendingTransactionDAL = createPendingTransactionDAL(basePath)
  const pendingTransactionCacheDAL = createPendingTransactionCacheDAL(basePath)
  const pendingTransactionFetchDAL = createPendingTransactionFetchDAL(basePath)
  const rawTransactionDAL = createRawTransactionDAL<EthereumRawTransaction>(basePath, false)

  const ethereumClient = createEthereumClient(url, accountSignatureDAL)

  const blockHistoryFetcher = new EthereumBlockHistoryFetcher(
    ethereumClient,
    rawBlockDAL,
    blockFetcherHistoryStateDAL,
  )

  const transactionHistoryFetcher = new EthereumTransactionHistoryFetcher(
    ethereumClient,
    transactionHistoryFetcherHistoryStateDAL,
    blockHistoryFetcher,
    fetcherClient,
    accountSignatureDAL,
    transactionHistoryPendingAccountDAL,
  )

  const transactionFetcher = new EthereumTransactionFetcher(
    ethereumClient,
    broker,
    pendingTransactionDAL,
    pendingTransactionCacheDAL,
    pendingTransactionFetchDAL,
    rawTransactionDAL,
  )

  const accountStateFetcher = new EthereumStateFetcher(
    ethereumClient,
    accountStateDAL,
    accountStatePendingAccountDAL,
  )

  return new EthereumFetcher(
    fetcherClient,
    transactionHistoryFetcher,
    transactionFetcher,
    accountStateFetcher,
    blockHistoryFetcher,
  )
}
