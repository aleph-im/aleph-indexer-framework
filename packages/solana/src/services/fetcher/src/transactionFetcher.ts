import { ServiceBroker } from 'moleculer'
import {
  BaseEntityFetcher,
  Blockchain,
  IndexableEntityType,
  PendingEntityStorage,
  RawEntityStorage,
} from '@aleph-indexer/framework'
import { SolanaRawTransaction } from '../../../types.js'
import { SolanaRPC } from '../../../sdk/client.js'

export class SolanaTransactionFetcher extends BaseEntityFetcher<SolanaRawTransaction> {
  constructor(
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    ...args: [
      ServiceBroker,
      PendingEntityStorage,
      PendingEntityStorage,
      PendingEntityStorage,
      RawEntityStorage<SolanaRawTransaction>,
    ]
  ) {
    super(IndexableEntityType.Transaction, Blockchain.Solana, ...args)
  }

  protected filterEntityId(id: string): boolean {
    const isSignature = id.length >= 64 && id.length <= 88
    if (!isSignature) console.log(`Fetcher Invalid signature ${id}`)
    return isSignature
  }

  protected remoteFetchIds(
    ids: string[],
    isRetry: boolean,
  ): Promise<(SolanaRawTransaction | null | undefined)[]> {
    const rpc = isRetry ? this.solanaMainPublicRpc : this.solanaRpc

    return rpc.getConfirmedTransactions(ids, {
      swallowErrors: true,
    })
  }
}
