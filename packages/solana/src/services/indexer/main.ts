import {
  BaseIndexer,
  Blockchain,
  BlockchainIndexerI,
  IndexerWorkerDomainI,
  IndexableEntityType,
  BaseEntityIndexer,
} from '@aleph-indexer/framework'

export class SolanaIndexer extends BaseIndexer implements BlockchainIndexerI {
  constructor(
    protected domain: IndexerWorkerDomainI,
    protected entityIndexers: Partial<
      Record<IndexableEntityType, BaseEntityIndexer<any>>
    >,
  ) {
    super(Blockchain.Solana, entityIndexers, domain)
  }
}
