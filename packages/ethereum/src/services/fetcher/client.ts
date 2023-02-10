import { ServiceBroker } from 'moleculer'
import {
  AccountEntityHistoryState,
  AddAccountEntityRequestArgs,
  BaseFetcherClient,
  Blockchain,
  BlockchainRequestArgs,
  DelAccountEntityRequestArgs,
  FetchAccountEntitiesByDateRequestArgs,
  FetchEntitiesByIdRequestArgs,
  FetcherClientI,
  GetAccountEntityStateRequestArgs,
  IndexableEntityType,
} from '@aleph-indexer/framework'

export class EthereumFetcherClient
  extends BaseFetcherClient
  implements FetcherClientI
{
  addAccountEntityFetcher(
    args: Omit<AddAccountEntityRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.addAccountEntityFetcher(args)
  }

  delAccountEntityFetcher(
    args: Omit<DelAccountEntityRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.delAccountEntityFetcher(args)
  }

  getAccountEntityFetcherState(
    args: Omit<GetAccountEntityStateRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<AccountEntityHistoryState<unknown> | undefined> {
    args.account = args.account.toLowerCase()
    return super.getAccountEntityFetcherState(args)
  }

  fetchAccountEntitiesByDate(
    args: Omit<
      FetchAccountEntitiesByDateRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<void | AsyncIterable<string[]>> {
    args.account = args.account.toLowerCase()
    return super.fetchAccountEntitiesByDate(args)
  }

  // @note: Right now we are caching all logs on the same instance than the accountLogHistory is saving the indexes
  // @todo: Implement getLogsByIds method on ethereum client, and do partitions by log id instead account
  async fetchEntitiesById(
    args: Omit<FetchEntitiesByIdRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void> {
    if (args.type === IndexableEntityType.Log && args.meta) {
      const { account } = args.meta as FetchAccountEntitiesByDateRequestArgs
      ;(args as any).partitionKey = account.toLowerCase()
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
