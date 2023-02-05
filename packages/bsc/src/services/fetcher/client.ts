import { ServiceBroker } from 'moleculer'
import {
  BaseFetcherClient,
  Blockchain,
  BlockchainRequestArgs,
  FetchAccountEntitiesByDateRequestArgs,
  FetchEntitiesByIdRequestArgs,
  FetcherClientI,
  IndexableEntityType,
} from '@aleph-indexer/framework'

export class EthereumFetcherClient
  extends BaseFetcherClient
  implements FetcherClientI
{
  // @note: Right now we are caching all logs on the same instance than the accountLogHistory is saving the indexes
  // @todo: Implement getLogsByIds method on ethereum client, and do partitions by log id instead account
  async fetchEntitiesById(
    args: Omit<FetchEntitiesByIdRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void> {
    if (args.type === IndexableEntityType.Log && args.meta) {
      const { account } = args.meta as FetchAccountEntitiesByDateRequestArgs
      ;(args as any).partitionKey = account
    }

    return super.fetchEntitiesById(args)
  }
}

export async function ethereumFetcherClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<FetcherClientI> {
  return new EthereumFetcherClient(blockchainId, broker)
}
