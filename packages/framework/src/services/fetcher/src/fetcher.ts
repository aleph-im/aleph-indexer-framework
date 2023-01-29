import {
  AddAccountStateRequestArgs,
  BlockchainFetcherI,
  CheckTransactionsRequestArgs,
  DelTransactionsRequestArgs,
  FetchAccountEntitiesByDateRequestArgs,
  FetcherState,
  FetcherStateRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  TransactionState,
  AddAccountEntityRequestArgs,
  DelAccountEntityRequestArgs,
  GetAccountEntityStateRequestArgs,
  DelAccountStateRequestArgs,
  GetAccountStateStateRequestArgs,
  AccountEntityHistoryState,
} from './types.js'
import { BaseTransactionHistoryFetcher } from './transactionHistoryFetcher.js'
import { BaseTransactionFetcher } from './transactionFetcher.js'
import { BaseStateFetcher } from './stateFetcher.js'
import { FetcherMsClient } from '../client.js'
import { Blockchain } from '../../../types.js'

/**
 * The main class of the fetcher service.
 */
export abstract class BaseFetcher implements BlockchainFetcherI {
  /**
   * Initialize the fetcher service.
   * @param blockchainId The blockchain identifier.
   * @param fetcherClient Allows communication with the sibling fetcher instances.
   * @param transactionHistoryFetcher It handles the account transactions tracking
   * @param transactionFetcher It handles transaction fetching by signatures
   * @param accountStateFetcher It handles the account state tracking
   */
  constructor(
    protected blockchainId: Blockchain,
    protected fetcherClient: FetcherMsClient,
    protected transactionHistoryFetcher: BaseTransactionHistoryFetcher<
      any,
      any
    >,
    protected transactionFetcher: BaseTransactionFetcher<any>,
    protected accountStateFetcher: BaseStateFetcher,
  ) {}

  async start(): Promise<void> {
    await Promise.all([
      this.transactionFetcher.start(),
      this.transactionHistoryFetcher.start(),
      this.accountStateFetcher.start(),
    ])
  }

  async stop(): Promise<void> {
    await Promise.all([
      this.transactionFetcher.stop(),
      this.transactionHistoryFetcher.stop(),
      this.accountStateFetcher.stop(),
    ])
  }

  addAccountTransactionFetcher(
    args: AddAccountEntityRequestArgs,
  ): Promise<void> {
    return this.transactionHistoryFetcher.addAccount(args)
  }

  delAccountTransactionFetcher(
    args: DelAccountEntityRequestArgs,
  ): Promise<void> {
    return this.transactionHistoryFetcher.delAccount(args)
  }

  getAccountTransactionFetcherState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<AccountEntityHistoryState<any> | undefined> {
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
    fetcher = this.fetcherClient.getNodeId(),
  }: FetcherStateRequestArgs): Promise<FetcherState> {
    const transactionFetcherState = await this.transactionFetcher.getState()
    const accountFetchers = await this.transactionHistoryFetcher.getState()

    return {
      ...transactionFetcherState,
      ...accountFetchers,
      blockchain: this.blockchainId,
      fetcher,
    }
  }

  fetchAccountTransactionsByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
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
