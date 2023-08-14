import {
  BaseEntityFetcher,
  BlockchainId,
  IndexableEntityType,
  PendingEntityStorage,
  RawEntityStorage,
} from '@aleph-indexer/framework'
import { ServiceBroker } from 'moleculer'
import { EthereumClient } from '../../../../sdk/client.js'
import { EthereumRawTransaction } from '../../../../types.js'

/**
 * The main class of the fetcher service.
 */
export class EthereumTransactionFetcher extends BaseEntityFetcher<EthereumRawTransaction> {
  constructor(
    protected blockchainId: BlockchainId,
    protected ethereumClient: EthereumClient,
    protected broker: ServiceBroker,
    protected pendingEntityDAL: PendingEntityStorage,
    protected pendingEntityCacheDAL: PendingEntityStorage,
    protected pendingEntityFetchDAL: PendingEntityStorage,
    protected entityCacheDAL: RawEntityStorage<EthereumRawTransaction>,
  ) {
    super(
      blockchainId,
      IndexableEntityType.Transaction,
      broker,
      pendingEntityDAL,
      pendingEntityCacheDAL,
      pendingEntityFetchDAL,
      entityCacheDAL,
    )
  }

  protected filterEntityId(id: string): boolean {
    // @todo: Filter valid ethereum signatures
    return id.toLocaleLowerCase() === id
  }

  protected remoteFetchIds(
    ids: string[],
    isRetry: boolean,
  ): Promise<(EthereumRawTransaction | null | undefined)[]> {
    return this.ethereumClient.getTransactions(ids, {
      swallowErrors: true,
    })
  }
}
