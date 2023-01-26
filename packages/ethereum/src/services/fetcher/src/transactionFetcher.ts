import {
  BaseTransactionFetcher,
  Blockchain,
  CheckTransactionsRequestArgs,
  DelTransactionsRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  PendingTransactionStorage,
  RawTransactionStorage,
  TransactionState,
} from '@aleph-indexer/framework'
import { ServiceBroker } from 'moleculer'
import { EthereumClient } from '../../../sdk/client.js'
import { EthereumRawTransaction } from '../../../types.js'

/**
 * The main class of the fetcher service.
 */
export class EthereumTransactionFetcher extends BaseTransactionFetcher<EthereumRawTransaction> {
  constructor(
    protected ethereumClient: EthereumClient,
    ...args: [
      ServiceBroker,
      PendingTransactionStorage,
      PendingTransactionStorage,
      PendingTransactionStorage,
      RawTransactionStorage<EthereumRawTransaction>,
    ]
  ) {
    super(Blockchain.Ethereum, ...args)
  }

  async getTransactionState(
    args: CheckTransactionsRequestArgs,
  ): Promise<TransactionState[]> {
    args.signatures = args.signatures.map((sig) => sig.toLowerCase())
    return super.getTransactionState(args)
  }

  async delTransactionCache(args: DelTransactionsRequestArgs): Promise<void> {
    args.signatures = args.signatures.map((sig) => sig.toLowerCase())
    return super.delTransactionCache(args)
  }

  async fetchTransactionsBySignature(
    args: FetchTransactionsBySignatureRequestArgs,
  ): Promise<void> {
    args.signatures = args.signatures.map((sig) => sig.toLowerCase())
    return super.fetchTransactionsBySignature(args)
  }

  protected isSignature(signature: string): boolean {
    const isSignature = signature.length >= 64 && signature.length <= 88
    if (!isSignature) console.log(`Fetcher Invalid signature ${signature}`)
    return isSignature
  }

  protected remoteFetch(
    signatures: string[],
    isRetry: boolean,
  ): Promise<(EthereumRawTransaction | null | undefined)[]> {
    return this.ethereumClient.getTransactions(signatures, {
      swallowErrors: true,
    })
  }
}
