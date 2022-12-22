/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import {
  createFetcherStateDAL,
  createEthereumClient,
  config,
  EthereumAccountState,
} from '@aleph-indexer/core'
import { EthereumFetcher } from '../../../services/fetcher/src/ethereum/fetcher.js'
import { createEthereumBlockDAL } from '../../../services/fetcher/src/ethereum/dal/block.js'
import { createEthereumAccountSignatureDAL } from '../../../services/fetcher/src/ethereum/dal/accountSignature.js'
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
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
  basePath: string,
): BlockchainFetcherI => {
  const url = config.ETHEREUM_RPC

  if (!url) throw new Error('ETHEREUM_RPC not configured')

  // DALs
  const blockDAL = createEthereumBlockDAL(basePath)
  const accountSignatureDAL = createEthereumAccountSignatureDAL(basePath)
  const accountStateDAL = createAccountStateDAL<EthereumAccountState>(basePath)
  const blockFetcherStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_block')
  const transactionHistoryFetcherStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_transaction_history')
  const transactionHistoryPendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_transaction_history_pending_account')
  const accountStatePendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_account_state_pending_account')

  const ethereumClient = createEthereumClient(
    url,
    basePath,
    accountSignatureDAL,
  )

  const blockFetcher = new EthereumBlockFetcher(
    ethereumClient,
    blockDAL,
    blockFetcherStateDAL,
  )

  const transactionHistoryFetcher = new EthereumTransactionHistoryFetcher(
    ethereumClient,
    transactionHistoryFetcherStateDAL,
    blockFetcher,
    fetcherClient,
    accountSignatureDAL,
    transactionHistoryPendingAccountDAL,
  )

  const transactionFetcher = new EthereumTransactionFetcher(
    ethereumClient,
    broker,
    createPendingTransactionDAL(basePath),
    createPendingTransactionCacheDAL(basePath),
    createPendingTransactionFetchDAL(basePath),
    createRawTransactionDAL(basePath),
  )

  const accountStateFetcher = new EthereumAccountStateFetcher(
    ethereumClient,
    accountStateDAL,
    accountStatePendingAccountDAL,
  )

  return new EthereumFetcher(
    broker,
    transactionHistoryFetcher,
    transactionFetcher,
    accountStateFetcher,
    blockFetcher,
  )
}
