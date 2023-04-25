import {
  BaseIndexer,
  Blockchain,
  BlockchainIndexerI,
  IndexerWorkerDomainI,
  IndexableEntityType,
  BaseEntityIndexer,
  IndexerMsClient,
} from '@aleph-indexer/framework'

export class EthereumIndexer extends BaseIndexer implements BlockchainIndexerI {
  constructor(
    protected indexerClient: IndexerMsClient,
    protected domain: IndexerWorkerDomainI,
    protected entityIndexers: Partial<
      Record<IndexableEntityType, BaseEntityIndexer<any>>
    >,
    protected blockchainId: Blockchain = Blockchain.Ethereum,
  ) {
    super(blockchainId, indexerClient, entityIndexers, domain)
  }
}
