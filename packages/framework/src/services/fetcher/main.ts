import { Blockchain } from '@aleph-indexer/core'
import { FetcherMsI } from './interface.js'
import {
  AddAccountTransactionRequestArgs,
  AddAccountStateRequestArgs,
  BlockchainFetcherI,
  DelAccountTransactionRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetcherState,
  FetchTransactionsBySignatureRequestArgs,
  GetAccountTransactionStateRequestArgs,
  AccountTransactionHistoryState,
  DelAccountStateRequestArgs,
  GetAccountStateStateRequestArgs,
  AccountStateState,
  CheckTransactionsRequestArgs,
  TransactionState,
  DelTransactionsRequestArgs,
  FetcherStateRequestArgs,
} from './src/base/types.js'
import { FetcherMsClient } from './client.js'
import { InvokeBlockchainMethodRequestArgs } from '../types.js'

/**
 * The main class of the fetcher service.
 */
export class FetcherMsMain implements FetcherMsI {
  protected inited = false

  /**
   * Initialize the fetcher service.
   * @param fetcherClient The fetcher ms client.
   * @param blockchainFetchers A dictionary of instances that implements BlockchainFetcherI interface
   */
  constructor(
    protected fetcherClient: FetcherMsClient,
    protected blockchainFetchers: Record<Blockchain, BlockchainFetcherI>,
  ) {}

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

  getAllFetchers(): string[] {
    return this.fetcherClient.getAllFetchers()
  }

  async getFetcherState(
    args: FetcherStateRequestArgs,
  ): Promise<Record<Blockchain, FetcherState>> {
    const { blockchainId } = args

    const blockchainFetchers = blockchainId
      ? [blockchainId, this.getBlockchainFetcher(blockchainId)]
      : Object.entries(this.blockchainFetchers)

    const fetcherState = await Promise.all(
      Object.entries(blockchainFetchers).map(
        async ([blockchainId, fetcher]) => {
          const state = await fetcher.getFetcherState(args)
          return [blockchainId, state]
        },
      ),
    )

    return Object.fromEntries(fetcherState)
  }

  // Account transaction

  async addAccountTransactionFetcher(
    args: AddAccountTransactionRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainFetcher(args.blockchainId)
    await fetcher.addAccountTransactionFetcher(args)
  }

  async delAccountTransactionFetcher(
    args: DelAccountTransactionRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainFetcher(args.blockchainId)
    await fetcher.delAccountTransactionFetcher(args)
  }

  async getAccountTransactionFetcherState(
    args: GetAccountTransactionStateRequestArgs,
  ): Promise<AccountTransactionHistoryState<unknown> | undefined> {
    const fetcher = this.getBlockchainFetcher(args.blockchainId)
    return fetcher.getAccountTransactionFetcherState(args)
  }

  // Account state

  async addAccountStateFetcher(
    args: AddAccountStateRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainFetcher(args.blockchainId)
    await fetcher.addAccountTransactionFetcher(args)
  }

  async delAccountStateFetcher(
    args: DelAccountStateRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainFetcher(args.blockchainId)
    await fetcher.delAccountTransactionFetcher(args)
  }

  async getAccountStateFetcherState(
    args: GetAccountStateStateRequestArgs,
  ): Promise<AccountStateState<unknown> | undefined> {
    const fetcher = this.getBlockchainFetcher(args.blockchainId)
    return fetcher.getAccountStateFetcherState(args)
  }

  // Transactions

  fetchAccountTransactionsByDate(
    args: FetchAccountTransactionsByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    const fetcher = this.getBlockchainFetcher(args.blockchainId)
    return fetcher.fetchAccountTransactionsByDate(args)
  }

  fetchTransactionsBySignature(
    args: FetchTransactionsBySignatureRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainFetcher(args.blockchainId)
    return fetcher.fetchTransactionsBySignature(args)
  }

  getTransactionState(
    args: CheckTransactionsRequestArgs,
  ): Promise<TransactionState[]> {
    const fetcher = this.getBlockchainFetcher(args.blockchainId)
    return fetcher.getTransactionState(args)
  }

  delTransactionCache(args: DelTransactionsRequestArgs): Promise<void> {
    const fetcher = this.getBlockchainFetcher(args.blockchainId)
    return fetcher.delTransactionCache(args)
  }

  // Extended methods

  async invokeBlockchainMethod<R, A>(
    args: InvokeBlockchainMethodRequestArgs<A>,
  ): Promise<R> {
    const { blockchainId, method, args: params } = args
    const fetcher = this.getBlockchainFetcher(blockchainId)

    if (!(method in fetcher)) {
      throw new Error(
        `Method "${method}" not supported in ${blockchainId} blockchain`,
      )
    }

    return (fetcher as any)[method]({ blockchainId, ...params })
  }

  protected getBlockchainFetcher(blockchainId: Blockchain): BlockchainFetcherI {
    const fetcher = this.blockchainFetchers[blockchainId]

    if (!fetcher) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return fetcher
  }

  protected getFetcherId(): string {
    return this.fetcherClient.getNodeId()
  }
}
