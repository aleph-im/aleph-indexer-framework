import { ServiceBroker } from 'moleculer'
import {
  BaseTransactionFetcher,
  Blockchain,
  PendingTransactionStorage,
  RawTransactionStorage,
} from '@aleph-indexer/framework'
import { SolanaRawTransaction } from '../../../types.js'
import { SolanaRPC } from '../../../sdk/client.js'

/**
 * The main class of the fetcher service.
 */
export class SolanaTransactionFetcher extends BaseTransactionFetcher<SolanaRawTransaction> {
  constructor(
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    ...args: [
      ServiceBroker,
      PendingTransactionStorage,
      PendingTransactionStorage,
      PendingTransactionStorage,
      RawTransactionStorage<SolanaRawTransaction>,
    ]
  ) {
    super(Blockchain.Solana, ...args)
  }

  protected isSignature(signature: string): boolean {
    const isSignature = signature.length >= 64 && signature.length <= 88
    if (!isSignature) console.log(`Fetcher Invalid signature ${signature}`)
    return isSignature
  }

  protected remoteFetch(
    signatures: string[],
    isRetry: boolean,
  ): Promise<(SolanaRawTransaction | null | undefined)[]> {
    const rpc = isRetry ? this.solanaMainPublicRpc : this.solanaRpc

    return rpc.getConfirmedTransactions(signatures, {
      swallowErrors: true,
    })
  }
}
