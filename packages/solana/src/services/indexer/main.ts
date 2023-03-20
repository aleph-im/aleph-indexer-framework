import {
  BaseIndexer,
  Blockchain,
  BlockchainIndexerI,
  IndexerWorkerDomainI,
  IndexableEntityType,
  BaseEntityIndexer,
  IndexerMsClient,
} from '@aleph-indexer/framework'

export class SolanaIndexer extends BaseIndexer implements BlockchainIndexerI {
  constructor(
    protected indexerClient: IndexerMsClient,
    protected domain: IndexerWorkerDomainI,
    protected entityIndexers: Partial<
      Record<IndexableEntityType, BaseEntityIndexer<any>>
    >,
  ) {
    super(Blockchain.Solana, indexerClient, entityIndexers, domain)
  }
}
