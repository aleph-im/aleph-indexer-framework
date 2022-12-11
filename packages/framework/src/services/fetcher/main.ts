import { ServiceBroker } from 'moleculer'
import { Blockchain } from '@aleph-indexer/core'
import { FetcherMsI, PrivateFetcherMsI } from './interface.js'
import {
  AddAccountFetcherRequestArgs,
  AddAccountInfoFetcherRequestArgs,
  CheckTransactionsRequestArgs,
  DelAccountFetcherRequestArgs,
  DelTransactionsRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetchAccountTransactionsBySlotRequestArgs,
  FetcherAccountPartitionRequestArgs,
  FetcherPartitionRequestArgs,
  FetcherState,
  FetchTransactionsBySignatureRequestArgs,
  GetAccountFetcherStateRequestArgs,
  SolanaSignatureFetcherState,
  TransactionState,
} from './src/types.js'
import { FetcherMsClient } from './client.js'
import { BlockchainFetcherI } from './src/blockchainFetcher.js'
import { SolanaFetcher } from './src/solana/fetcher.js'

/**
 * The main class of the fetcher service.
 */
export class FetcherMsMain implements FetcherMsI, PrivateFetcherMsI {
  protected fetcherMsClient: FetcherMsClient
  protected throughput = 0
  protected throughputInit = Date.now()
  protected inited = false

  /**
   * Initialize the fetcher service.
   * @param broker The moleculer broker to assign to the service.
   * @param blockchainFetchers A dictionary of instances that implements BlockchainFetcherI interface
   */
  constructor(
    protected broker: ServiceBroker,
    protected blockchainFetchers: Record<Blockchain, BlockchainFetcherI>,
  ) {
    this.fetcherMsClient = new FetcherMsClient(broker)
  }

  /**
   * Initialize the fetcher service.
   * First fetches pending transactions and parses them, then loads existing
   * requests to the service.
   */
  async start(): Promise<void> {
    if (this.inited) return
    this.inited = true

    await Promise.all(
      Object.values(this.blockchainFetchers).map((fetcher) => fetcher.start()),
    )
  }

  async stop(): Promise<void> {
    if (!this.inited) return
    this.inited = false

    await Promise.all(
      Object.values(this.blockchainFetchers).map((fetcher) => fetcher.stop()),
    )
  }

  // @todo: Make the Main class moleculer-agnostic by DI
  getAllFetchers(): string[] {
    return this.fetcherMsClient.getAllFetchers()
  }

  /**
   * Assigns to a fetcher instance an account owned by the specific program
   * and initializes it.
   * @param args Account address to assign to the fetcher instance
   */
  async addAccountFetcher(args: AddAccountFetcherRequestArgs): Promise<void> {
    const fetcher = this.blockchainFetchers[args.blockchainId]
    if (!fetcher) throw new Error(`${args.blockchainId} not supported`)

    await fetcher.addAccountFetcher(args)
  }

  async getAccountFetcherState(
    args: GetAccountFetcherStateRequestArgs,
  ): Promise<SolanaSignatureFetcherState | undefined> {
    const fetcher = this.blockchainFetchers[args.blockchainId]
    if (!fetcher) throw new Error(`${args.blockchainId} not supported`)

    return fetcher.getAccountFetcherState(args)
  }

  async delAccountFetcher(args: DelAccountFetcherRequestArgs): Promise<void> {
    const fetcher = this.blockchainFetchers[args.blockchainId]
    if (!fetcher) throw new Error(`${args.blockchainId} not supported`)

    await fetcher.delAccountFetcher(args)
  }

  // @todo: Refactor specific blockchain ethods with extended api calls

  fetchAccountTransactionsByDate(
    args: FetchAccountTransactionsByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    // @todo: Refactor it
    const fetcher = this.blockchainFetchers[Blockchain.Solana]
    return (fetcher as SolanaFetcher).fetchAccountTransactionsByDate(args)
  }

  getFetcherState(args: FetcherPartitionRequestArgs): Promise<FetcherState> {
    // @todo: Refactor it
    const fetcher = this.blockchainFetchers[Blockchain.Solana]
    return (fetcher as SolanaFetcher).getFetcherState(args)
  }

  getTransactionState(
    args: CheckTransactionsRequestArgs,
  ): Promise<TransactionState[]> {
    // @todo: Refactor it
    const fetcher = this.blockchainFetchers[Blockchain.Solana]
    return (fetcher as SolanaFetcher).getTransactionState(args)
  }

  delAccountInfoFetcher(
    args: FetcherAccountPartitionRequestArgs,
  ): Promise<void> {
    // @todo: Refactor it
    const fetcher = this.blockchainFetchers[Blockchain.Solana]
    return (fetcher as SolanaFetcher).delAccountInfoFetcher(args)
  }

  delTransactionCache(args: DelTransactionsRequestArgs): Promise<void> {
    // @todo: Refactor it
    const fetcher = this.blockchainFetchers[Blockchain.Solana]
    return (fetcher as SolanaFetcher).delTransactionCache(args)
  }

  addAccountInfoFetcher(args: AddAccountInfoFetcherRequestArgs): Promise<void> {
    // @todo: Refactor it
    const fetcher = this.blockchainFetchers[Blockchain.Solana]
    return (fetcher as SolanaFetcher).addAccountInfoFetcher(args)
  }

  fetchAccountTransactionsBySlot(
    args: FetchAccountTransactionsBySlotRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    // @todo: Refactor it
    const fetcher = this.blockchainFetchers[Blockchain.Solana]
    return (fetcher as SolanaFetcher).fetchAccountTransactionsBySlot(args)
  }
  fetchTransactionsBySignature(
    args: FetchTransactionsBySignatureRequestArgs,
  ): Promise<void> {
    // @todo: Refactor it
    const fetcher = this.blockchainFetchers[Blockchain.Solana]
    return (fetcher as SolanaFetcher).fetchTransactionsBySignature(args)
  }

  // @todo: Make the Main class moleculer-agnostic by DI
  protected getFetcherId(): string {
    return this.broker.nodeID
  }
}
