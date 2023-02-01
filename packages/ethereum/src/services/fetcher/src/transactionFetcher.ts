import {
  BaseEntityFetcher,
  Blockchain,
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
