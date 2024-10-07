/* eslint-disable prettier/prettier */
import { ServiceBroker } from 'moleculer'
import { Utils } from '@aleph-indexer/core'
import {
  BaseEntityFetcherMain,
  BaseFetcher,
  BlockchainId,
  BlockchainFetcherI,
  createFetcherStateDAL,
  createPendingAccountDAL,
  createPendingEntityCacheDAL,
  createPendingEntityDAL,
  createPendingEntityFetchDAL,
  createRawEntityDAL,
  FetcherMsClient,
  IndexableEntityType,
  getBlockchainEnv,
  // createAccountStateDAL,
} from '@aleph-indexer/framework'

import { createSolanaAccountTransactionHistoryDAL } from './src/dal/accountTransactionHistory.js'
import { SolanaRawTransaction } from '../../types.js'
import { SolanaTransactionFetcher } from './src/transactionFetcher.js'
import { SolanaTransactionHistoryFetcher } from './src/transactionHistoryFetcher.js'
import { MAIN_SOLANA_CLUSTER_URL } from '../../utils/constants.js'
import { SolanaRPC, SolanaRPCRoundRobin } from '../../sdk/client.js'
// import { SolanaStateFetcher } from './src/stateFetcher.js'
// import { SolanaAccountState } from './src/types.js'


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function solanaDalsFetcherFactory(basePath: string) {
  return {
    accountSignatureDAL: createSolanaAccountTransactionHistoryDAL(basePath),
    // accountStateDAL: createAccountStateDAL<SolanaAccountState>(basePath, true),
    transactionHistoryFetcherStateDAL: createFetcherStateDAL(basePath, 'fetcher_state_transaction_history'),
    transactionHistoryPendingAccountDAL: createPendingAccountDAL(basePath, 'fetcher_pending_account_transaction_history'),
    // accountStatePendingAccountDAL: createPendingAccountDAL(basePath, 'fetcher_pending_account_account_state'),
    pendingEntityDAL: createPendingEntityDAL(basePath, IndexableEntityType.Transaction),
    pendingEntityCacheDAL: createPendingEntityCacheDAL(basePath, IndexableEntityType.Transaction),
    pendingEntityFetchDAL: createPendingEntityFetchDAL(basePath, IndexableEntityType.Transaction),
    rawTransactionDAL: createRawEntityDAL<SolanaRawTransaction>(basePath, IndexableEntityType.Transaction, true),

  }
}

function getClusterConfig(
  blockchainId: BlockchainId,
  DALs: ReturnType<typeof solanaDalsFetcherFactory>,
): {
  historyRpcRR: SolanaRPCRoundRobin
  historyRpc: SolanaRPC,
  privateRpcRR: SolanaRPCRoundRobin
  privateRpc: SolanaRPC,
} {
  const historicEnv = getBlockchainEnv(blockchainId, 'HISTORIC_RPC', false) || `${MAIN_SOLANA_CLUSTER_URL}|true`
  const [historicUrls, historicRateLimitStr] = historicEnv.split('|')
  const historicUrlList = historicUrls.split(',')
  const historicRateLimit = historicRateLimitStr === 'true'

  const historyRpcRR = new SolanaRPCRoundRobin(historicUrlList, historicRateLimit, DALs.accountSignatureDAL)
  const historyRpc = historyRpcRR.getProxy()


  const privateEnv = getBlockchainEnv(blockchainId, 'RPC', true)
  let privateRpcRR = historyRpcRR
  let privateRpc = historyRpc

  if (privateEnv !== historicEnv) {
    const [privateUrls, privateRateLimitStr] = privateEnv.split('|')
    const privateUrlList = privateUrls.split(',')
    const privateRateLimit = privateRateLimitStr === 'true'

    privateRpcRR = new SolanaRPCRoundRobin(privateUrlList, privateRateLimit, DALs.accountSignatureDAL)
    privateRpc = privateRpcRR.getProxy()
  }

  return {
    historyRpcRR,
    historyRpc,
    privateRpcRR,
    privateRpc
  }
}

export async function solanaFetcherFactory(
  blockchainId: BlockchainId,
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
): Promise<BlockchainFetcherI> {
  if (basePath) await Utils.ensurePath(basePath)

  const DALs = solanaDalsFetcherFactory(basePath)

  const {
    historyRpcRR,
    historyRpc,
    privateRpcRR,
    privateRpc
  } = getClusterConfig(blockchainId, DALs)

  // @note: Force resolve DNS and cache it before starting fetcher
  await Promise.allSettled(
    [
      ...privateRpcRR.getAllClients(),
      ...historyRpcRR.getAllClients(),
    ].map(async (client) => {
      const conn = client.getConnection()
      const { result } = await (conn as any)._rpcRequest('getBlockHeight', [])
      console.log(`RPC ${conn.endpoint} last height: ${result}`)
    }),
  )

  const transactionHistoryFetcher = new SolanaTransactionHistoryFetcher(
    blockchainId,
    privateRpc,
    historyRpc,
    DALs.transactionHistoryFetcherStateDAL,
    fetcherClient,
    DALs.transactionHistoryPendingAccountDAL,
    DALs.accountSignatureDAL,
  )

  const transactionFetcher = new SolanaTransactionFetcher(
    blockchainId,
    privateRpc,
    historyRpc,
    broker,
    DALs.pendingEntityDAL,
    DALs.pendingEntityCacheDAL,
    DALs.pendingEntityFetchDAL,
    DALs.rawTransactionDAL,
  )

  // const accountStateFetcherMain = new SolanaStateFetcher(
  //   blockchainId,
  //   privateRpc,
  //   historyRpc,
  //   accountStateDAL,
  //   accountStatePendingAccountDAL,
  // )

  const transactionFetcherMain = new BaseEntityFetcherMain(
    IndexableEntityType.Transaction,
    transactionFetcher,
    transactionHistoryFetcher,
  )

  const entityFetchers: any = {
    [IndexableEntityType.Transaction]: transactionFetcherMain,
    // [IndexableEntityType.State]: accountStateFetcherMain,
  }

  return new BaseFetcher(
    blockchainId,
    fetcherClient,
    entityFetchers
  )
}
