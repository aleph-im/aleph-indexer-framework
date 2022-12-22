import { ServiceBroker } from 'moleculer'
import { Blockchain } from '@aleph-indexer/core'
import {
  AddAccountStateRequestArgs,
  BlockchainFetcherI,
  CheckTransactionsRequestArgs,
  DelTransactionsRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetcherState,
  FetcherStateRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  TransactionState,
  AddAccountTransactionRequestArgs,
  DelAccountTransactionRequestArgs,
  GetAccountTransactionStateRequestArgs,
  DelAccountStateRequestArgs,
  GetAccountStateStateRequestArgs,
  AccountTransactionHistoryState,
} from '../base/types.js'
import { BaseTransactionHistoryFetcher } from '../base/transactionHistoryFetcher.js'
import { BaseTransactionFetcher } from '../base/transactionFetcher.js'
import { BaseStateFetcher } from './stateFetcher.js'

/**
 * The main class of the fetcher service.
 */
export abstract class BaseFetcher implements BlockchainFetcherI {
  /**
   * Initialize the fetcher service.
   * @param blockchainId The blockchain identifier.
   * @param broker The moleculer broker to assign to the service.
   * @param transactionHistoryFetcher It handles the account transactions tracking
   * @param transactionFetcher It handles transaction fetching by signatures
   * @param accountStateFetcher It handles the account state tracking
   */
  constructor(
    protected blockchainId: Blockchain,
    protected broker: ServiceBroker,
    protected transactionHistoryFetcher: BaseTransactionHistoryFetcher<
      any,
      any
    >,
    protected transactionFetcher: BaseTransactionFetcher<any>,
    protected accountStateFetcher: BaseStateFetcher,
  ) {}

  async start(): Promise<void> {
    await this.transactionFetcher.start()
  }

  async stop(): Promise<void> {
    await this.transactionFetcher.stop()
  }

  addAccountTransactionFetcher(
    args: AddAccountTransactionRequestArgs,
  ): Promise<void> {
    return this.transactionHistoryFetcher.addAccount(args)
  }

  delAccountTransactionFetcher(
    args: DelAccountTransactionRequestArgs,
  ): Promise<void> {
    return this.transactionHistoryFetcher.delAccount(args)
  }

  getAccountTransactionFetcherState(
    args: GetAccountTransactionStateRequestArgs,
  ): Promise<AccountTransactionHistoryState<any> | undefined> {
    return this.transactionHistoryFetcher.getAccountState(args)
  }

  addAccountStateFetcher(args: AddAccountStateRequestArgs): Promise<void> {
    return this.accountStateFetcher.addAccount(args)
  }

  delAccountStateFetcher(args: DelAccountStateRequestArgs): Promise<void> {
    return this.accountStateFetcher.delAccount(args)
  }

  // @todo: Implement it
  getAccountStateFetcherState(
    args: GetAccountStateStateRequestArgs,
  ): Promise<any> {
    throw new Error('Method not implemented.')
  }

  async getFetcherState({
    fetcher = this.broker.nodeID,
  }: FetcherStateRequestArgs): Promise<FetcherState> {
    const transactionFetcherState = await this.transactionFetcher.getState()
    const accountFetchers = await this.transactionHistoryFetcher.getState()

    return {
      ...transactionFetcherState,
      ...accountFetchers,
      fetcher,
    }
  }

  fetchAccountTransactionsByDate(
    args: FetchAccountTransactionsByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.transactionHistoryFetcher.fetchAccountTransactionsByDate(args)
  }

  fetchTransactionsBySignature(
    args: FetchTransactionsBySignatureRequestArgs,
  ): Promise<void> {
    return this.transactionFetcher.fetchTransactionsBySignature(args)
  }

  getTransactionState(
    args: CheckTransactionsRequestArgs,
  ): Promise<TransactionState[]> {
    return this.transactionFetcher.getTransactionState(args)
  }

  delTransactionCache(args: DelTransactionsRequestArgs): Promise<void> {
    return this.transactionFetcher.delTransactionCache(args)
  }
}
