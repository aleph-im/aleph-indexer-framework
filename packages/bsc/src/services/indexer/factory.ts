/* eslint-disable prettier/prettier */
import { Utils } from '@aleph-indexer/core'
import {
  BaseEntityIndexer,
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
} from '@aleph-indexer/framework'
import { BscParsedLog, BscParsedTransaction } from '../parser/src/types.js'
import { BscIndexer } from './main.js'
import { BscIndexerLogFetcher } from './src/logFetcher.js'
import { BscIndexerTransactionFetcher } from './src/transactionFetcher.js'

export async function bscIndexerFactory(
  basePath: string,
  domain: IndexerWorkerDomainI,
  indexerMsClient: IndexerMsClient,
  fetcherMsClient: FetcherMsClient,
  parserMsClient: ParserMsClient,
): Promise<BlockchainIndexerI> {
  await Utils.ensurePath(basePath)

  // DALs

  const transactionRequestDAL = createEntityRequestDAL(basePath, IndexableEntityType.Transaction)
  const transactionRequestIncomingEntityDAL = createEntityRequestIncomingEntityDAL<BscParsedTransaction>(basePath, IndexableEntityType.Transaction)
  const transactionRequestPendingSignatureDAL = createEntityRequestPendingEntityDAL(basePath, IndexableEntityType.Transaction)
  const transactionRequestResponseDAL = createEntityRequestResponseDAL(basePath, IndexableEntityType.Transaction)
  const transactionIndexerStateDAL = createEntityIndexerStateDAL(basePath, IndexableEntityType.Transaction)

  const logRequestDAL = createEntityRequestDAL(basePath, IndexableEntityType.Log)
  const logRequestIncomingEntityDAL = createEntityRequestIncomingEntityDAL<BscParsedLog>(basePath, IndexableEntityType.Log)
  const logRequestPendingSignatureDAL = createEntityRequestPendingEntityDAL(basePath, IndexableEntityType.Log)
  const logRequestResponseDAL = createEntityRequestResponseDAL(basePath, IndexableEntityType.Log)
  const logIndexerStateDAL = createEntityIndexerStateDAL(basePath, IndexableEntityType.Log)

  // Instances

  const transactionFetcher = new BscIndexerTransactionFetcher(
    fetcherMsClient,
    transactionRequestDAL,
    transactionRequestIncomingEntityDAL,
    transactionRequestPendingSignatureDAL,
    transactionRequestResponseDAL,
  )

  const transactionFetcherMain = new BaseEntityIndexer(
    IndexableEntityType.Transaction,
    Blockchain.Bsc,
    indexerMsClient,
    fetcherMsClient,
    parserMsClient,
    transactionIndexerStateDAL,
    transactionFetcher,
  )

  const logFetcher = new BscIndexerLogFetcher(
    fetcherMsClient,
    logRequestDAL,
    logRequestIncomingEntityDAL,
    logRequestPendingSignatureDAL,
    logRequestResponseDAL,
  )

  const logFetcherMain = new BaseEntityIndexer(
    IndexableEntityType.Log,
    Blockchain.Bsc,
    indexerMsClient,
    fetcherMsClient,
    parserMsClient,
    logIndexerStateDAL,
    logFetcher,
  )

  const entityIndexers = {
    [IndexableEntityType.Transaction]: transactionFetcherMain,
    [IndexableEntityType.Log]: logFetcherMain
  }

  return new BscIndexer(
    domain,
    entityIndexers,
  )
}
