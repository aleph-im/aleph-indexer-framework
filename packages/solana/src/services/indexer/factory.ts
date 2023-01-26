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
  const transactionRequestDAL = createTransactionRequestDAL(basePath)
  const transactionRequestIncomingTransactionDAL =
    createTransactionRequestIncomingTransactionDAL<SolanaParsedTransaction>(
      basePath,
    )
  const transactionRequestPendingSignatureDAL =
    createTransactionRequestPendingSignatureDAL(basePath)
  const transactionRequestResponseDAL =
    createTransactionRequestResponseDAL(basePath)
  const transactionIndexerStateDAL = createTransactionIndexerStateDAL(basePath)

  const transactionFetcher = new SolanaIndexerTransactionFetcher(
    Blockchain.Solana,
    fetcherMsClient,
    transactionRequestDAL,
    transactionRequestIncomingTransactionDAL,
    transactionRequestPendingSignatureDAL,
    transactionRequestResponseDAL,
  )

  return new SolanaIndexer(
    domain,
    indexerMsClient,
    fetcherMsClient,
    parserMsClient,
    transactionIndexerStateDAL,
    transactionFetcher,
  )
}
