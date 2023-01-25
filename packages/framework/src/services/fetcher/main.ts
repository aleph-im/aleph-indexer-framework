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
import { Blockchain } from '../../types/common.js'

/**
 * The main class of the fetcher service.
 */
export class FetcherMsMain implements FetcherMsI {
  protected inited = false

  /**
   * Initialize the fetcher service.
   * @param fetcherClient The fetcher ms client.
   * @param blockchains A dictionary of instances that implements BlockchainFetcherI interface
   */
  constructor(
    protected fetcherClient: FetcherMsClient,
    protected blockchains: Record<Blockchain, BlockchainFetcherI>,
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
      Object.values(this.blockchains).map((fetcher) => fetcher.start()),
    )
  }

  async stop(): Promise<void> {
    if (!this.inited) return
    this.inited = false

    await Promise.all(
      Object.values(this.blockchains).map((fetcher) => fetcher.stop()),
    )
  }

  getAllFetchers(): string[] {
    return this.fetcherClient.getAllFetchers()
  }

  async getFetcherState(
    args: FetcherStateRequestArgs,
  ): Promise<FetcherState[]> {
    const { blockchainId } = args

    const blockchains =
      blockchainId && blockchainId.length > 0
        ? blockchainId.map((id) => this.getBlockchainInstance(id))
        : Object.values(this.blockchains)

    return Promise.all(
      blockchains.map((fetcher) => fetcher.getFetcherState(args)),
    )
  }

  // Account transaction

  async addAccountTransactionFetcher(
    args: AddAccountTransactionRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    await fetcher.addAccountTransactionFetcher(args)
  }

  async delAccountTransactionFetcher(
    args: DelAccountTransactionRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    await fetcher.delAccountTransactionFetcher(args)
  }

  async getAccountTransactionFetcherState(
    args: GetAccountTransactionStateRequestArgs,
  ): Promise<AccountTransactionHistoryState<unknown> | undefined> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.getAccountTransactionFetcherState(args)
  }

  // Account state

  async addAccountStateFetcher(
    args: AddAccountStateRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    await fetcher.addAccountTransactionFetcher(args)
  }

  async delAccountStateFetcher(
    args: DelAccountStateRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    await fetcher.delAccountTransactionFetcher(args)
  }

  async getAccountStateFetcherState(
    args: GetAccountStateStateRequestArgs,
  ): Promise<AccountStateState<unknown> | undefined> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.getAccountStateFetcherState(args)
  }

  // Transactions

  fetchAccountTransactionsByDate(
    args: FetchAccountTransactionsByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.fetchAccountTransactionsByDate(args)
  }

  fetchTransactionsBySignature(
    args: FetchTransactionsBySignatureRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.fetchTransactionsBySignature(args)
  }

  getTransactionState(
    args: CheckTransactionsRequestArgs,
  ): Promise<TransactionState[]> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.getTransactionState(args)
  }

  delTransactionCache(args: DelTransactionsRequestArgs): Promise<void> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.delTransactionCache(args)
  }

  // Extended methods

  async invokeBlockchainMethod<R, A>(
    args: InvokeBlockchainMethodRequestArgs<A>,
  ): Promise<R> {
    const { blockchainId, method, args: params } = args
    const fetcher = this.getBlockchainInstance(blockchainId)

    if (!(method in fetcher)) {
      throw new Error(
        `Method "${method}" not supported in ${blockchainId} blockchain`,
      )
    }

    return (fetcher as any)[method]({ blockchainId, ...params })
  }

  protected getBlockchainInstance(
    blockchainId: Blockchain,
  ): BlockchainFetcherI {
    const instance = this.blockchains[blockchainId]

    if (!instance) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return instance
  }

  protected getFetcherId(): string {
    return this.fetcherClient.getNodeId()
  }
}
