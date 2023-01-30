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
import { EthereumParsedTransaction } from '../parser/src/types.js'
import { EthereumIndexer } from './main.js'
import { EthereumIndexerTransactionFetcher } from './src/transactionFetcher.js'

export async function ethereumIndexerFactory(
  basePath: string,
  domain: IndexerWorkerDomainI,
  indexerMsClient: IndexerMsClient,
  fetcherMsClient: FetcherMsClient,
  parserMsClient: ParserMsClient,
): Promise<BlockchainIndexerI> {
  await Utils.ensurePath(basePath)

  // DALs
  const transactionRequestDAL = createEntityRequestDAL(basePath, IndexableEntityType.Transaction)
  const transactionRequestIncomingTransactionDAL = createEntityRequestIncomingEntityDAL<EthereumParsedTransaction>(basePath, IndexableEntityType.Transaction)
  const transactionRequestPendingSignatureDAL = createEntityRequestPendingEntityDAL(basePath, IndexableEntityType.Transaction)
  const transactionRequestResponseDAL = createEntityRequestResponseDAL(basePath, IndexableEntityType.Transaction)
  const transactionIndexerStateDAL = createEntityIndexerStateDAL(basePath, IndexableEntityType.Transaction)

  const transactionFetcher = new EthereumIndexerTransactionFetcher(
    Blockchain.Ethereum,
    fetcherMsClient,
    transactionRequestDAL,
    transactionRequestIncomingTransactionDAL,
    transactionRequestPendingSignatureDAL,
    transactionRequestResponseDAL,
  )


  const transactionFetcherMain = new BaseEntityIndexer(
    IndexableEntityType.Transaction,
    Blockchain.Ethereum,
    indexerMsClient,
    fetcherMsClient,
    parserMsClient,
    transactionIndexerStateDAL,
    transactionFetcher,
  )

  const entityIndexers = {
    [IndexableEntityType.Transaction]: transactionFetcherMain
  }

  return new EthereumIndexer(
    domain,
    entityIndexers,
  )
}
