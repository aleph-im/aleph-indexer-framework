/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import {
  solanaPrivateRPC,
  solanaMainPublicRPC,
  createFetcherStateDAL,
  SolanaAccountState,
  SolanaRawTransaction,
} from '@aleph-indexer/core'
import { SolanaFetcher } from '../../../services/fetcher/src/solana/fetcher.js'
import {
  createPendingTransactionCacheDAL,
  createPendingTransactionDAL,
  createPendingTransactionFetchDAL,
} from '../../../services/fetcher/src/base/dal/pendingTransaction.js'
import { createRawTransactionDAL } from '../../../services/fetcher/src/base/dal/rawTransaction.js'
import { createSolanaAccountTransactionHistoryDAL } from '../../../services/fetcher/src/solana/dal/accountTransactionHistory.js'
import { createPendingAccountDAL } from '../../../services/fetcher/src/base/dal/account.js'
import { BlockchainFetcherI } from '../../../services/fetcher/src/base/types.js'
import { SolanaTransactionFetcher } from '../../../services/fetcher/src/solana/transactionFetcher.js'
import { SolanaTransactionHistoryFetcher } from '../../../services/fetcher/src/solana/transactionHistoryFetcher.js'
import { SolanaAccountStateFetcher } from '../../../services/fetcher/src/solana/accountStateFetcher.js'
import { FetcherMsClient } from '../../../services/fetcher/client.js'
import { createAccountStateDAL } from '../../../services/fetcher/src/base/dal/accountState.js'

export default (
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): BlockchainFetcherI => {
  // DALs
  const accountSignatureDAL = createSolanaAccountTransactionHistoryDAL(basePath)
  const accountStateDAL = createAccountStateDAL<SolanaAccountState>(basePath)
  const transactionHistoryFetcherStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_transaction_history')
  const transactionHistoryPendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_transaction_history')
  const accountStatePendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_account_state')
  const pendingTransactionDAL = createPendingTransactionDAL(basePath)
  const pendingTransactionCacheDAL = createPendingTransactionCacheDAL(basePath)
  const pendingTransactionFetchDAL = createPendingTransactionFetchDAL(basePath)
  const rawTransactionDAL = createRawTransactionDAL<SolanaRawTransaction>(basePath)

  const transactionHistoryFetcher = new SolanaTransactionHistoryFetcher(
    solanaPrivateRPC,
    solanaMainPublicRPC,
    transactionHistoryFetcherStateDAL,
    fetcherClient,
    accountSignatureDAL,
    transactionHistoryPendingAccountDAL,
  )

  const transactionFetcher = new SolanaTransactionFetcher(
    solanaPrivateRPC,
    solanaMainPublicRPC,
    broker,
    pendingTransactionDAL,
    pendingTransactionCacheDAL,
    pendingTransactionFetchDAL,
    rawTransactionDAL,
  )

  const accountStateFetcher = new SolanaAccountStateFetcher(
    solanaPrivateRPC,
    solanaMainPublicRPC,
    accountStateDAL,
    accountStatePendingAccountDAL,
  )

  return new SolanaFetcher(
    fetcherClient,
    transactionHistoryFetcher,
    transactionFetcher,
    accountStateFetcher,
  )
}
