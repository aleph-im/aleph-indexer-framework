/* eslint-disable prettier/prettier */
import { Blockchain } from '@aleph-indexer/core'
import { BlockchainIndexerI, IndexerMsClient, IndexerWorkerDomainI } from '../../../main.js'
import { EthereumIndexer } from '../../../services/indexer/src/ethereum/indexer.js'
import { createTransactionIndexerStateDAL } from '../../../services/indexer/src/base/dal/transactionIndexerState.js'
import { createTransactionRequestDAL } from '../../../services/indexer/src/base/dal/transactionRequest.js'
import { createTransactionRequestIncomingTransactionDAL } from '../../../services/indexer/src/base/dal/transactionRequestIncomingTransaction.js'
import { createTransactionRequestPendingSignatureDAL } from '../../../services/indexer/src/base/dal/transactionRequestPendingSignature.js'
import { createTransactionRequestResponseDAL } from '../../../services/indexer/src/base/dal/transactionRequestResponse.js'
import { TransactionFetcher } from '../../../services/indexer/src/base/transactionFetcher.js'
import { FetcherMsClient } from '../../../services/fetcher/client.js'
import { ParserMsClient } from '../../../services/parser/client.js'

export default async (
  basePath: string,
  domain: IndexerWorkerDomainI,
  indexerMsClient: IndexerMsClient,
  fetcherMsClient: FetcherMsClient,
  parserMsClient: ParserMsClient,
): Promise<BlockchainIndexerI> => {
  // DALs
  const transactionRequestDAL = createTransactionRequestDAL(basePath)
  const transactionRequestIncomingTransactionDAL = createTransactionRequestIncomingTransactionDAL(basePath)
  const transactionRequestPendingSignatureDAL = createTransactionRequestPendingSignatureDAL(basePath)
  const transactionRequestResponseDAL = createTransactionRequestResponseDAL(basePath)
  const transactionIndexerStateDAL = createTransactionIndexerStateDAL(basePath)

  const transactionFetcher = new TransactionFetcher(
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
