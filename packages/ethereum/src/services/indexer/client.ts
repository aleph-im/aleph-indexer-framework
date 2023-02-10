import { ServiceBroker } from 'moleculer'
import {
  BaseIndexerClient,
  Blockchain,
  BlockchainRequestArgs,
  IndexerClientI,
  InvokeMethodRequestArgs,
} from '@aleph-indexer/framework'

export class EthereumIndexerClient
  extends BaseIndexerClient
  implements IndexerClientI
{
  invokeDomainMethod(
    args: Omit<InvokeMethodRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<unknown> {
    args.account = args.account.toLowerCase()
    return super.invokeDomainMethod(args)
  }
}

export async function ethereumIndexerClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<IndexerClientI> {
  return new EthereumIndexerClient(blockchainId, broker)
}
