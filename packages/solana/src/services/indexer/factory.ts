/* eslint-disable prettier/prettier */
import { Utils } from '@aleph-indexer/core'
import {
  Blockchain,
  BlockchainIndexerI,
  createEntityIndexerStateDAL,
  createEntityRequestDAL,
  createEntityRequestIncomingEntityDAL,
  createEntityRequestPendingEntityDAL,
  createEntityRequestResponseDAL,
  FetcherMsClient,
  IndexableEntityType,
  IndexerMsClient,
  IndexerWorkerDomainI,
  ParserMsClient,
  BaseEntityIndexer
} from '@aleph-indexer/framework'
import { SolanaParsedTransaction } from '../../types.js'
import { SolanaIndexer } from './main.js'
import { SolanaIndexerTransactionFetcher } from './src/transactionFetcher.js'

export async function solanaIndexerFactory(
  basePath: string,
  domain: IndexerWorkerDomainI,
  indexerMsClient: IndexerMsClient,
  fetcherMsClient: FetcherMsClient,
  parserMsClient: ParserMsClient,
): Promise<BlockchainIndexerI> {
  await Utils.ensurePath(basePath)

  // DALs
  const transactionRequestDAL = createEntityRequestDAL(basePath, IndexableEntityType.Transaction)
  const transactionRequestIncomingTransactionDAL = createEntityRequestIncomingEntityDAL<SolanaParsedTransaction>(basePath, IndexableEntityType.Transaction)
  const transactionRequestPendingSignatureDAL = createEntityRequestPendingEntityDAL(basePath, IndexableEntityType.Transaction)
  const transactionRequestResponseDAL = createEntityRequestResponseDAL(basePath, IndexableEntityType.Transaction)
  const transactionIndexerStateDAL = createEntityIndexerStateDAL(basePath, IndexableEntityType.Transaction)

 
  const transactionFetcher = new SolanaIndexerTransactionFetcher(
    Blockchain.Solana,
    fetcherMsClient,
    transactionRequestDAL,
    transactionRequestIncomingTransactionDAL,
    transactionRequestPendingSignatureDAL,
    transactionRequestResponseDAL,
  )

  const transactionFetcherMain = new BaseEntityIndexer(
    IndexableEntityType.Transaction,
    Blockchain.Solana,
    indexerMsClient,
    fetcherMsClient,
    parserMsClient,
    transactionIndexerStateDAL,
    transactionFetcher,
  )

  const entityIndexers = {
    [IndexableEntityType.Transaction]: transactionFetcherMain
  }

  return new SolanaIndexer(
    domain,
    entityIndexers,
  )
}
