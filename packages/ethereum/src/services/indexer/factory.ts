/* eslint-disable prettier/prettier */
import { Utils } from '@aleph-indexer/core'
import {
  Blockchain,
  BlockchainIndexerI,
  createTransactionIndexerStateDAL,
  createTransactionRequestDAL,
  createTransactionRequestIncomingTransactionDAL,
  createTransactionRequestPendingSignatureDAL,
  createTransactionRequestResponseDAL,
  FetcherMsClient,
  IndexerMsClient,
  IndexerWorkerDomainI,
  ParserMsClient,
} from '@aleph-indexer/framework'
import { EthereumParsedTransaction } from '../parser/src/types.js'
import { EthereumIndexer } from './main.js'
import { EthereumIndexerTransactionFetcher } from './src/transactionFetcher.js'

export async function ethereumIndexerFactory (
  basePath: string,
  domain: IndexerWorkerDomainI,
  indexerMsClient: IndexerMsClient,
  fetcherMsClient: FetcherMsClient,
  parserMsClient: ParserMsClient,
): Promise<BlockchainIndexerI> {
  await Utils.ensurePath(basePath)

  // DALs
  const transactionRequestDAL = createTransactionRequestDAL(basePath)
  const transactionRequestIncomingTransactionDAL = createTransactionRequestIncomingTransactionDAL<EthereumParsedTransaction>(basePath)
  const transactionRequestPendingSignatureDAL = createTransactionRequestPendingSignatureDAL(basePath)
  const transactionRequestResponseDAL = createTransactionRequestResponseDAL(basePath)
  const transactionIndexerStateDAL = createTransactionIndexerStateDAL(basePath)

  const transactionFetcher = new EthereumIndexerTransactionFetcher(
    Blockchain.Ethereum,
    fetcherMsClient,
    transactionRequestDAL,
    transactionRequestIncomingTransactionDAL,
    transactionRequestPendingSignatureDAL,
    transactionRequestResponseDAL,
  )

  return new EthereumIndexer(
    domain,
    indexerMsClient,
    fetcherMsClient,
    parserMsClient,
    transactionIndexerStateDAL,
    transactionFetcher,
  )
}
