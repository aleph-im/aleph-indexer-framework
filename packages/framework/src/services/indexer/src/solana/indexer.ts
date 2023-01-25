import { FetcherMsClient } from '../../../fetcher/client.js'
import { ParserMsClient } from '../../../parser/client.js'
import { TransactionIndexerStateStorage } from '../base/dal/transactionIndexerState.js'
import { BlockchainIndexerI, IndexerWorkerDomainI } from '../base/types.js'
import { BaseIndexer } from '../base/indexer.js'
import { IndexerMsClient } from '../../client.js'
import { SolanaTransactionFetcher } from './transactionFetcher.js'
import { Blockchain } from '../../../../types/common.js'
import { SolanaParsedTransaction } from '../../../../types/solana.js'

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
    protected transactionFetcher: SolanaTransactionFetcher,
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
