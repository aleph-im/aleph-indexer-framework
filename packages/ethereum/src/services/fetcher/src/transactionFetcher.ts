import {
  BaseEntityFetcher,
  Blockchain,
  CheckEntityRequestArgs,
  DelEntityRequestArgs,
  EntityState,
  FetchEntitiesByIdRequestArgs,
  IndexableEntityType,
  PendingEntityStorage,
  RawEntityStorage,
} from '@aleph-indexer/framework'
import { ServiceBroker } from 'moleculer'
import { EthereumClient } from '../../../sdk/client.js'
import { EthereumRawTransaction } from '../../../types.js'

/**
 * The main class of the fetcher service.
 */
export class EthereumTransactionFetcher extends BaseEntityFetcher<EthereumRawTransaction> {
  constructor(
    protected ethereumClient: EthereumClient,
    ...args: [
      ServiceBroker,
      PendingEntityStorage,
      PendingEntityStorage,
      PendingEntityStorage,
      RawEntityStorage<EthereumRawTransaction>,
    ]
  ) {
    super(IndexableEntityType.Transaction, Blockchain.Ethereum, ...args)
  }

  async getEntityState(args: CheckEntityRequestArgs): Promise<EntityState[]> {
    args.ids = args.ids.map((id) => id.toLowerCase())
    return super.getEntityState(args)
  }

  async delEntityCache(args: DelEntityRequestArgs): Promise<void> {
    args.ids = args.ids.map((id) => id.toLowerCase())
    return super.delEntityCache(args)
  }

  async fetchEntitiesById(args: FetchEntitiesByIdRequestArgs): Promise<void> {
    args.ids = args.ids.map((id) => id.toLowerCase())
    return super.fetchEntitiesById(args)
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
