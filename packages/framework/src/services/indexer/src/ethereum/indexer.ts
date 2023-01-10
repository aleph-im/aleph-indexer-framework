import { Blockchain } from '@aleph-indexer/core'
import { FetcherMsClient } from '../../../fetcher/client.js'
import { ParserMsClient } from '../../../parser/client.js'
import { TransactionIndexerStateStorage } from '../base/dal/transactionIndexerState.js'
import { TransactionFetcher } from '../base/transactionFetcher.js'
import { BlockchainIndexerI, IndexerWorkerDomainI } from '../base/types.js'
import { BaseIndexer } from '../base/indexer.js'
import { IndexerMsClient } from '../../client.js'

export class EthereumIndexer extends BaseIndexer implements BlockchainIndexerI {
  constructor(
    protected domain: IndexerWorkerDomainI,
    protected indexerClient: IndexerMsClient,
    protected fetcherClient: FetcherMsClient,
    protected parserClient: ParserMsClient,
    protected transactionIndexerStateDAL: TransactionIndexerStateStorage,
    protected transactionFetcher: TransactionFetcher,
  ) {
    super(
      Blockchain.Ethereum,
      domain,
      indexerClient,
      fetcherClient,
      parserClient,
      transactionIndexerStateDAL,
      transactionFetcher,
    )
  }
}
