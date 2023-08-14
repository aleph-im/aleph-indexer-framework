import { ServiceBroker } from 'moleculer'
import {
  BaseEntityFetcher,
  BlockchainId,
  IndexableEntityType,
  PendingEntityStorage,
  RawEntityStorage,
} from '@aleph-indexer/framework'
import { SolanaRawTransaction } from '../../../types.js'
import { SolanaRPC } from '../../../sdk/client.js'

/**
 * Fetches transactions from the Solana blockchain.
 */
export class SolanaTransactionFetcher extends BaseEntityFetcher<SolanaRawTransaction> {
  constructor(
    protected blockchainId: BlockchainId,
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
    super(blockchainId, IndexableEntityType.Transaction, ...args)
  }

  protected filterEntityId(id: string): boolean {
    const isSignature = id.length >= 64 && id.length <= 88
    if (!isSignature)
      console.log(
        `${this.blockchainId} transaction | Fetcher Invalid signature ${id}`,
      )
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
