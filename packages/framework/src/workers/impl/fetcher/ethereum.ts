/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import {
  createFetcherStateDAL,
  createEthereumClient,
  config,
  EthereumAccountState,
  EthereumRawTransaction,
} from '@aleph-indexer/core'
import { EthereumFetcher } from '../../../services/fetcher/src/ethereum/fetcher.js'
import { createEthereumBlockDAL as createEthereumRawBlockDAL } from '../../../services/fetcher/src/ethereum/dal/block.js'
import { createEthereumAccountTransactionHistoryDAL } from '../../../services/fetcher/src/ethereum/dal/accountTransactionHistory.js'
import { BlockchainFetcherI } from '../../../services/fetcher/src/base/types.js'
import { EthereumTransactionHistoryFetcher } from '../../../services/fetcher/src/ethereum/transactionHistoryFetcher.js'
import { EthereumTransactionFetcher } from '../../../services/fetcher/src/ethereum/transactionFetcher.js'
import { EthereumAccountStateFetcher } from '../../../services/fetcher/src/ethereum/accountStateFetcher.js'
import { EthereumBlockFetcher } from '../../../services/fetcher/src/ethereum/blockFetcher.js'
import { createPendingAccountDAL } from '../../../services/fetcher/src/base/dal/account.js'
import { FetcherMsClient } from '../../../services/fetcher/client.js'
import {
  createPendingTransactionCacheDAL,
  createPendingTransactionDAL,
  createPendingTransactionFetchDAL,
} from '../../../services/fetcher/src/base/dal/pendingTransaction.js'
import { createRawTransactionDAL } from '../../../services/fetcher/src/base/dal/rawTransaction.js'
import { createAccountStateDAL } from '../../../services/fetcher/src/base/dal/accountState.js'

export default (
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): BlockchainFetcherI => {
  const url = config.ETHEREUM_RPC

  if (!url) throw new Error('ETHEREUM_RPC not configured')

  // DALs
  const rawBlockDAL = createEthereumRawBlockDAL(basePath)
  const accountSignatureDAL = createEthereumAccountTransactionHistoryDAL(basePath)
  const accountStateDAL = createAccountStateDAL<EthereumAccountState>(basePath)
  const blockFetcherHistoryStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_block')
  const transactionHistoryFetcherHistoryStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_transaction_history')
  const transactionHistoryPendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_transaction_history')
  const accountStatePendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_account_state')
  const pendingTransactionDAL =  createPendingTransactionDAL(basePath)
  const pendingTransactionCacheDAL =  createPendingTransactionCacheDAL(basePath)
  const pendingTransactionFetchDAL =  createPendingTransactionFetchDAL(basePath)
  const rawTransactionDAL =  createRawTransactionDAL<EthereumRawTransaction>(basePath)

  const ethereumClient = createEthereumClient(
    url,
    basePath,
    accountSignatureDAL,
  )

  const blockFetcher = new EthereumBlockFetcher(
    ethereumClient,
    rawBlockDAL,
    blockFetcherHistoryStateDAL,
  )

  const transactionHistoryFetcher = new EthereumTransactionHistoryFetcher(
    ethereumClient,
    transactionHistoryFetcherHistoryStateDAL,
    blockFetcher,
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

  const accountStateFetcher = new EthereumAccountStateFetcher(
    ethereumClient,
    accountStateDAL,
    accountStatePendingAccountDAL,
  )

  return new EthereumFetcher(
    fetcherClient,
    transactionHistoryFetcher,
    transactionFetcher,
    accountStateFetcher,
    blockFetcher,
  )
}
