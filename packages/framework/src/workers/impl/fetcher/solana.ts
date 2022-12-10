import { ServiceBroker } from 'moleculer'
import {
  solanaPrivateRPC,
  solanaMainPublicRPC,
  createFetcherStateDAL,
} from '@aleph-indexer/core'
import { SolanaFetcher } from '../../../services/fetcher/src/solana/fetcher.js'
import { createAccountInfoDAL } from '../../../services/fetcher/src/dal/accountInfo.js'
import {
  createPendingTransactionCacheDAL,
  createPendingTransactionDAL,
  createPendingTransactionFetchDAL,
} from '../../../services/fetcher/src/dal/pendingTransaction.js'
import { createRawTransactionDAL } from '../../../services/fetcher/src/dal/rawTransaction.js'
import { createSignatureDAL } from '../../../services/fetcher/src/solana/dal/signature.js'
import { createRequestsDAL } from '../../../services/fetcher/src/dal/requests.js'
import { createAccountDAL } from '../../../services/fetcher/src/dal/account.js'
import { BlockchainFetcherI } from '../../../services/fetcher/src/blockchainFetcher.js'

export default (broker: ServiceBroker, basePath: string): BlockchainFetcherI =>
  new SolanaFetcher(
    broker,
    createSignatureDAL(basePath),
    createAccountDAL(basePath),
    createPendingTransactionDAL(basePath),
    createPendingTransactionCacheDAL(basePath),
    createPendingTransactionFetchDAL(basePath),
    createRawTransactionDAL(basePath),
    createAccountInfoDAL(basePath),
    createRequestsDAL(basePath),
    solanaPrivateRPC,
    solanaMainPublicRPC,
    createFetcherStateDAL(basePath),
  )
