/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { Utils } from '@aleph-indexer/core'
import {
  BaseEntityFetcherMain,
  BlockchainFetcherI,
  createAccountStateDAL,
  createFetcherStateDAL,
  createPendingAccountDAL,
  createPendingEntityCacheDAL,
  createPendingEntityDAL,
  createPendingEntityFetchDAL,
  createRawEntityDAL,
  FetcherMsClient,
  IndexableEntityType,
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
  const pendingEntityDAL = createPendingEntityDAL(basePath, IndexableEntityType.Transaction)
  const pendingEntityCacheDAL = createPendingEntityCacheDAL(basePath, IndexableEntityType.Transaction)
  const pendingEntityFetchDAL = createPendingEntityFetchDAL(basePath, IndexableEntityType.Transaction)
  const rawTransactionDAL = createRawEntityDAL<SolanaRawTransaction>(basePath, IndexableEntityType.Transaction, true)

  const transactionHistoryFetcher = new SolanaTransactionHistoryFetcher(
    solanaPrivateRPC,
    solanaMainPublicRPC,
    transactionHistoryFetcherStateDAL,
    fetcherClient,
    transactionHistoryPendingAccountDAL,
    accountSignatureDAL,
  )

  const transactionFetcher = new SolanaTransactionFetcher(
    solanaPrivateRPC,
    solanaMainPublicRPC,
    broker,
    pendingEntityDAL,
    pendingEntityCacheDAL,
    pendingEntityFetchDAL,
    rawTransactionDAL,
  )

  const accountStateFetcherMain = new SolanaStateFetcher(
    solanaPrivateRPC,
    solanaMainPublicRPC,
    accountStateDAL,
    accountStatePendingAccountDAL,
  )

  const transactionFetcherMain = new BaseEntityFetcherMain(
    IndexableEntityType.Transaction,
    transactionFetcher,
    transactionHistoryFetcher,
  )

  const entityFetchers = {
    [IndexableEntityType.Transaction]: transactionFetcherMain,
  }

  return new SolanaFetcher(
    fetcherClient,
    entityFetchers
  )
}
