import { ServiceBroker } from 'moleculer'
import {
  BaseFetcherClient,
  BlockchainId,
  FetcherClientI,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import { FetchAccountTransactionsBySlotRequestArgs } from './src/types.js'
import { normalizeAccount, normalizeEntityId } from '../../utils/normalize.js'

export default class SolanaFetcherClient
  extends BaseFetcherClient
  implements FetcherClientI
{
  normalizeAccount(account: string): string {
    return normalizeAccount(account)
  }

  normalizeEntityId(entity: IndexableEntityType, id: string): string {
    return normalizeEntityId(entity, id)
  }

  async fetchAccountTransactionsBySlot(
    args: Omit<FetchAccountTransactionsBySlotRequestArgs, 'blockchainId'>,
  ): Promise<void | AsyncIterable<string[]>> {
    const account = this.normalizeAccount(args.account)

    return this.invokeBlockchainMethod({
      partitionKey: account,
      method: 'fetchAccountTransactionsBySlot',
      args: {
        indexerId: this.broker.nodeID,
        ...args,
        account,
      },
    })
  }
}

export async function solanaFetcherClientFactory(
  blockchainId: BlockchainId,
  broker: ServiceBroker,
): Promise<FetcherClientI> {
  return new SolanaFetcherClient(blockchainId, broker)
}
