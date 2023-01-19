import { ServiceBroker } from 'moleculer'
import {
  Blockchain,
  EthereumClient,
  EthereumRawTransaction,
} from '@aleph-indexer/core'
import { PendingTransactionStorage } from '../base/dal/pendingTransaction.js'
import { RawTransactionStorage } from '../base/dal/rawTransaction.js'
import { BaseTransactionFetcher } from '../base/transactionFetcher.js'
import {
  CheckTransactionsRequestArgs,
  DelTransactionsRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  TransactionState,
} from '../base/types.js'

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
      shallowErrors: true,
    })
  }
}
