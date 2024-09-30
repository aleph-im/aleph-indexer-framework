/* eslint-disable prettier/prettier */
import { Utils } from '@aleph-indexer/core'
import {
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
  ParserMsClient,
  BaseEntityIndexer,
  BaseIndexer
} from '@aleph-indexer/framework'
import { SolanaParsedTransaction } from '../../types.js'
import { SolanaIndexerTransactionFetcher } from './src/transactionFetcher.js'

export async function solanaIndexerFactory(
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
  const transactionRequestIncomingTransactionDAL = createEntityRequestIncomingEntityDAL<SolanaParsedTransaction>(basePath, IndexableEntityType.Transaction)
  const transactionRequestPendingSignatureDAL = createEntityRequestPendingEntityDAL(basePath, IndexableEntityType.Transaction)
  const transactionRequestResponseDAL = createEntityRequestResponseDAL(basePath, IndexableEntityType.Transaction)
  const transactionIndexerStateDAL = createEntityIndexerStateDAL(basePath, IndexableEntityType.Transaction)

  const transactionFetcher = new SolanaIndexerTransactionFetcher(
    blockchainId,
    fetcherMsClient,
    transactionRequestDAL,
    transactionRequestIncomingTransactionDAL,
    transactionRequestPendingSignatureDAL,
    transactionRequestResponseDAL,
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

  const entityIndexers: any = {
    [IndexableEntityType.Transaction]: transactionFetcherMain
  }

  return new BaseIndexer(
    blockchainId,
    indexerMsClient,
    entityIndexers,
    domain,
  )
}
