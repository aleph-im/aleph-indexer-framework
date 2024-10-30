/* eslint-disable prettier/prettier */
import { Utils } from '@aleph-indexer/core'
import {
  BaseEntityIndexer,
  BaseIndexer,
  BlockchainId,
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
  NonceTimestamp,
  ParserMsClient,
} from '@aleph-indexer/framework'
import { EthereumParsedLog, EthereumParsedTransaction } from '../parser/src/types.js'
import { EthereumIndexerLogFetcher } from './src/logFetcher.js'
import { EthereumIndexerTransactionFetcher } from './src/transactionFetcher.js'

export async function ethereumIndexerFactory(
  blockchainId: BlockchainId,
  basePath: string,
  domain: IndexerWorkerDomainI,
  indexerMsClient: IndexerMsClient,
  fetcherMsClient: FetcherMsClient,
  parserMsClient: ParserMsClient,
): Promise<BlockchainIndexerI> {
  await Utils.ensurePath(basePath)

  // DALs

  const transactionRequestDAL = createEntityRequestDAL(basePath, IndexableEntityType.Transaction)
  const transactionRequestIncomingEntityDAL = createEntityRequestIncomingEntityDAL<EthereumParsedTransaction>(basePath, IndexableEntityType.Transaction)
  const transactionRequestPendingSignatureDAL = createEntityRequestPendingEntityDAL(basePath, IndexableEntityType.Transaction)
  const transactionRequestResponseDAL = createEntityRequestResponseDAL(basePath, IndexableEntityType.Transaction)
  const transactionIndexerStateDAL = createEntityIndexerStateDAL(basePath, IndexableEntityType.Transaction)

  const logRequestDAL = createEntityRequestDAL(basePath, IndexableEntityType.Log)
  const logRequestIncomingEntityDAL = createEntityRequestIncomingEntityDAL<EthereumParsedLog>(basePath, IndexableEntityType.Log)
  const logRequestPendingSignatureDAL = createEntityRequestPendingEntityDAL(basePath, IndexableEntityType.Log)
  const logRequestResponseDAL = createEntityRequestResponseDAL(basePath, IndexableEntityType.Log)
  const logIndexerStateDAL = createEntityIndexerStateDAL(basePath, IndexableEntityType.Log)

  // Instances

  const nonce = new NonceTimestamp()

  const transactionFetcher = new EthereumIndexerTransactionFetcher(
    blockchainId,
    fetcherMsClient,
    transactionRequestDAL,
    transactionRequestIncomingEntityDAL,
    transactionRequestPendingSignatureDAL,
    transactionRequestResponseDAL,
    nonce
  )

  const transactionFetcherMain = new BaseEntityIndexer(
    blockchainId,
    IndexableEntityType.Transaction,
    domain,
    indexerMsClient,
    fetcherMsClient,
    parserMsClient,
    transactionIndexerStateDAL,
    transactionFetcher,
  )

  const logFetcher = new EthereumIndexerLogFetcher(
    blockchainId,
    fetcherMsClient,
    logRequestDAL,
    logRequestIncomingEntityDAL,
    logRequestPendingSignatureDAL,
    logRequestResponseDAL,
    nonce
  )

  const logFetcherMain = new BaseEntityIndexer(
    blockchainId,
    IndexableEntityType.Log,
    domain,
    indexerMsClient,
    fetcherMsClient,
    parserMsClient,
    logIndexerStateDAL,
    logFetcher,
  )

  const entityIndexers = {
    [IndexableEntityType.Transaction]: transactionFetcherMain,
    [IndexableEntityType.Log]: logFetcherMain
  } as Record<IndexableEntityType, BaseEntityIndexer<any>>

  return new BaseIndexer(
    blockchainId,
    indexerMsClient,
    entityIndexers,
    domain,
  )
}
