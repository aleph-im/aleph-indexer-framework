import { ServiceBroker } from 'moleculer'
import {
  AccountIndexerRequestArgs,
  AccountIndexerState,
  BaseIndexerClient,
  Blockchain,
  BlockchainRequestArgs,
  EntityRequest,
  GetAccountIndexingEntityStateRequestArgs,
  GetEntityPendingRequestsRequestArgs,
  IndexerClientI,
  InvokeMethodRequestArgs,
} from '@aleph-indexer/framework'

// @note: partitionKey is based on account param, and the "hash(account)" could change depending
// on the address format and case-sensitiveness
export class EthereumIndexerClient
  extends BaseIndexerClient
  implements IndexerClientI
{
  indexAccount(
    args: Omit<AccountIndexerRequestArgs, keyof BlockchainRequestArgs>,
    broadcast = false,
  ): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.indexAccount(args, broadcast)
  }

  deleteAccount(
    args: Omit<AccountIndexerRequestArgs, keyof BlockchainRequestArgs>,
    broadcast = false,
  ): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.deleteAccount(args, broadcast)
  }

  getAccountState(
    args: Omit<
      GetAccountIndexingEntityStateRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<AccountIndexerState | undefined> {
    args.account = args.account.toLowerCase()
    return super.getAccountState(args)
  }

  invokeDomainMethod(
    args: Omit<InvokeMethodRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<unknown> {
    args.account = args.account.toLowerCase()
    return super.invokeDomainMethod(args)
  }

  getEntityPendingRequests(
    args: Omit<
      GetEntityPendingRequestsRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<EntityRequest[]> {
    args.account = args.account ? args.account.toLowerCase() : args.account
    return super.getEntityPendingRequests(args)
  }
}

export async function ethereumIndexerClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<IndexerClientI> {
  return new EthereumIndexerClient(blockchainId, broker)
}
