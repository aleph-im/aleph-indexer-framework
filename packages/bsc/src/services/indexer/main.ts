import {
  Blockchain,
  BlockchainIndexerI,
  IndexerWorkerDomainI,
  IndexableEntityType,
  BaseEntityIndexer,
  IndexerMsClient,
} from '@aleph-indexer/framework'
import { EthereumIndexer } from '@aleph-indexer/ethereum'

export class BscIndexer extends EthereumIndexer implements BlockchainIndexerI {
  constructor(
    indexerClient: IndexerMsClient,
    domain: IndexerWorkerDomainI,
    entityIndexers: Partial<
      Record<IndexableEntityType, BaseEntityIndexer<any>>
    >,
    blockchainId: Blockchain = Blockchain.Bsc,
  ) {
    super(indexerClient, domain, entityIndexers, blockchainId)
  }
}
