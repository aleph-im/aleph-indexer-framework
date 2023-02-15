import {
  AccountIndexerRequestArgs,
  AccountIndexerState,
  BaseIndexer,
  Blockchain,
  BlockchainIndexerI,
  IndexerWorkerDomainI,
  IndexableEntityType,
  BaseEntityIndexer,
  GetAccountIndexingEntityStateRequestArgs,
  DelAccountIndexerRequestArgs,
  GetEntityPendingRequestsRequestArgs,
  EntityRequest,
} from '@aleph-indexer/framework'

export class EthereumIndexer extends BaseIndexer implements BlockchainIndexerI {
  constructor(
    protected domain: IndexerWorkerDomainI,
    protected entityIndexers: Partial<
      Record<IndexableEntityType, BaseEntityIndexer<any>>
    >,
    protected blockchainId: Blockchain = Blockchain.Ethereum,
  ) {
    super(blockchainId, entityIndexers, domain)
  }

  async indexAccount(args: AccountIndexerRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.indexAccount(args)
  }

  async deleteAccount(args: DelAccountIndexerRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.deleteAccount(args)
  }

  async getAccountState(
    args: GetAccountIndexingEntityStateRequestArgs,
  ): Promise<AccountIndexerState | undefined> {
    args.account = args.account.toLowerCase()
    return super.getAccountState(args)
  }

  async getEntityPendingRequests(
    args: GetEntityPendingRequestsRequestArgs,
  ): Promise<EntityRequest[]> {
    if (args.account) args.account = args.account.toLowerCase()
    if (args.id) args.id = args.id.toLowerCase()

    return super.getEntityPendingRequests(args)
  }
}
