import {
  BaseIndexer,
  Blockchain,
  BlockchainIndexerI,
  FetcherMsClient,
  IndexerMsClient,
  IndexerWorkerDomainI,
  ParserMsClient,
  TransactionIndexerStateStorage,
} from '@aleph-indexer/framework'
import { SolanaIndexerTransactionFetcher } from './src/transactionFetcher.js'
import { SolanaParsedTransaction } from '../../types.js'

export class SolanaIndexer
  extends BaseIndexer<SolanaParsedTransaction>
  implements BlockchainIndexerI
{
  constructor(
    protected domain: IndexerWorkerDomainI,
    protected indexerClient: IndexerMsClient,
    protected fetcherClient: FetcherMsClient,
    protected parserClient: ParserMsClient,
    protected transactionIndexerStateDAL: TransactionIndexerStateStorage,
    protected transactionFetcher: SolanaIndexerTransactionFetcher,
  ) {
    super(
      Blockchain.Solana,
      domain,
      indexerClient,
      fetcherClient,
      parserClient,
      transactionIndexerStateDAL,
      transactionFetcher,
    )
  }
}
