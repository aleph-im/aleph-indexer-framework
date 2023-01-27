/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { Utils } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  createAccountStateDAL,
  createFetcherStateDAL,
  createPendingAccountDAL,
  createPendingTransactionCacheDAL,
  createPendingTransactionDAL,
  createPendingTransactionFetchDAL,
  createRawTransactionDAL,
  FetcherMsClient,
} from '@aleph-indexer/framework'
import {
  solanaMainPublicRPC,
  solanaMainPublicRPCRoundRobin,
  solanaPrivateRPC,
  solanaPrivateRPCRoundRobin,
} from '../../sdk/index.js'
import { createSolanaAccountTransactionHistoryDAL } from './src/dal/accountTransactionHistory.js'
import { SolanaRawTransaction } from '../../types.js'
import { SolanaFetcher } from './main.js'
import { SolanaStateFetcher } from './src/stateFetcher.js'
import { SolanaTransactionFetcher } from './src/transactionFetcher.js'
import { SolanaTransactionHistoryFetcher } from './src/transactionHistoryFetcher.js'
import { SolanaAccountState } from './src/types.js'

export async function solanaFetcherFactory(
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  if (basePath) await Utils.ensurePath(basePath)

  // @note: Force resolve DNS and cache it before starting fetcher
  await Promise.allSettled(
    [
      ...solanaPrivateRPCRoundRobin.getAllClients(),
      ...solanaMainPublicRPCRoundRobin.getAllClients(),
    ].map(async (client) => {
      const conn = client.getConnection()
      const { result } = await (conn as any)._rpcRequest('getBlockHeight', [])
      console.log(`RPC ${conn.endpoint} last height: ${result}`)
    }),
  )

  // DALs
  const accountSignatureDAL = createSolanaAccountTransactionHistoryDAL(basePath)
  const accountStateDAL = createAccountStateDAL<SolanaAccountState>(basePath, true)
  const transactionHistoryFetcherStateDAL = createFetcherStateDAL(basePath, 'fetcher_state_transaction_history')
  const transactionHistoryPendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_transaction_history')
  const accountStatePendingAccountDAL = createPendingAccountDAL(basePath, 'fetcher_pending_account_account_state')
  const pendingTransactionDAL = createPendingTransactionDAL(basePath)
  const pendingTransactionCacheDAL = createPendingTransactionCacheDAL(basePath)
  const pendingTransactionFetchDAL = createPendingTransactionFetchDAL(basePath)
  const rawTransactionDAL = createRawTransactionDAL<SolanaRawTransaction>(basePath, true)

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

  const accountStateFetcher = new SolanaStateFetcher(
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
