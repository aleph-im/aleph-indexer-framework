import {
  Blockchain,
  BlockchainIndexerI,
  IndexerWorkerDomainI,
  IndexableEntityType,
  BaseEntityIndexer,
} from '@aleph-indexer/framework'
import { EthereumIndexer } from '@aleph-indexer/ethereum'

export class BscIndexer extends EthereumIndexer implements BlockchainIndexerI {
  constructor(
    domain: IndexerWorkerDomainI,
    entityIndexers: Partial<
      Record<IndexableEntityType, BaseEntityIndexer<any>>
    >,
    blockchainId: Blockchain = Blockchain.Bsc,
  ) {
    super(domain, entityIndexers, blockchainId)
  }
}
