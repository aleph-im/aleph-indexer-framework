/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { config, Utils } from '@aleph-indexer/core'
import { EthereumFetcher } from '../../../services/fetcher/src/ethereum/fetcher.js'
import { createEthereumBlockDAL as createEthereumRawBlockDAL } from '../../../services/fetcher/src/ethereum/dal/block.js'
import { createEthereumAccountTransactionHistoryDAL } from '../../../services/fetcher/src/ethereum/dal/accountTransactionHistory.js'
import { BlockchainFetcherI } from '../../../services/fetcher/src/base/types.js'
import { EthereumTransactionHistoryFetcher } from '../../../services/fetcher/src/ethereum/transactionHistoryFetcher.js'
import { EthereumTransactionFetcher } from '../../../services/fetcher/src/ethereum/transactionFetcher.js'
import { EthereumStateFetcher } from '../../../services/fetcher/src/ethereum/stateFetcher.js'
import { EthereumBlockHistoryFetcher } from '../../../services/fetcher/src/ethereum/blockHistoryFetcher.js'
import { createPendingAccountDAL } from '../../../services/fetcher/src/base/dal/account.js'
import { FetcherMsClient } from '../../../services/fetcher/client.js'
import {
  createPendingTransactionCacheDAL,
  createPendingTransactionDAL,
  createPendingTransactionFetchDAL,
} from '../../../services/fetcher/src/base/dal/pendingTransaction.js'
import { createRawTransactionDAL } from '../../../services/fetcher/src/base/dal/rawTransaction.js'
import { createAccountStateDAL } from '../../../services/fetcher/src/base/dal/accountState.js'
import { EthereumAccountState } from '../../../services/fetcher/src/ethereum/types.js'
import { createFetcherStateDAL } from '../../../services/fetcher/src/base/dal/fetcherState.js'
import { EthereumRawTransaction } from '../../../types/ethereum.js'
import { createEthereumClient } from '../../../rpc/ethereum/index.js'

export default async (
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> => {
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
