import { ServiceBroker, Context, Service } from 'moleculer'
import { MsIds, MainFactory, shardBalancingStrategy } from '../common.js'
import { FetcherMsMain } from './main.js'
import {
  FetcherAccountPartitionRequestArgs,
  AddAccountInfoFetcherRequestArgs,
  CheckTransactionsRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetchAccountTransactionsBySlotRequestArgs,
  FetcherState,
  FetcherStateRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  SignatureFetcherState,
  TransactionState,
} from './src/types.js'

/**
 * A wrapper of the Molueculer service to expose the main fetcher service through the broker.
 */
export class FetcherMs extends Service {
  public static mainFactory: MainFactory<FetcherMsMain>

  protected main!: FetcherMsMain

  constructor(broker: ServiceBroker) {
    super(broker)

    this.main = FetcherMs.mainFactory(broker)

    this.parseServiceSchema({
      name: MsIds.Fetcher,
      actions: {
        addAccountFetcher: {
          ...shardBalancingStrategy,
          handler: this.addAccountFetcher,
        },
        delAccountFetcher: {
          ...shardBalancingStrategy,
          handler: this.delAccountFetcher,
        },
        getAccountFetcherState: {
          ...shardBalancingStrategy,
          handler: this.getAccountFetcherState,
        },
        addAccountInfoFetcher: {
          ...shardBalancingStrategy,
          handler: this.addAccountInfoFetcher,
        },
        delAccountInfoFetcher: {
          ...shardBalancingStrategy,
          handler: this.delAccountInfoFetcher,
        },
        fetchAccountTransactionsByDate: {
          ...shardBalancingStrategy,
          handler: this.fetchAccountTransactionsByDate,
        },
        fetchAccountTransactionsBySlot: {
          ...shardBalancingStrategy,
          handler: this.fetchAccountTransactionsBySlot,
        },
        fetchTransactionsBySignature: {
          ...shardBalancingStrategy,
          handler: this.fetchTransactionsBySignature,
        },
        getFetcherState: {
          ...shardBalancingStrategy,
          handler: this.getFetcherState,
        },
        getTransactionState: {
          ...shardBalancingStrategy,
          handler: this.getTransactionState,
        },
      },
      started: this.start,
      stopped: this.stop,
    })
  }

  start(): Promise<void> {
    return this.main.start()
  }

  stop(): Promise<void> {
    return this.main.stop()
  }

  addAccountFetcher(
    ctx: Context<FetcherAccountPartitionRequestArgs>,
  ): Promise<void> {
    return this.main.addAccountFetcher(ctx.params)
  }

  delAccountFetcher(
    ctx: Context<FetcherAccountPartitionRequestArgs>,
  ): Promise<void> {
    return this.main.delAccountFetcher(ctx.params)
  }

  getAccountFetcherState(
    ctx: Context<FetcherAccountPartitionRequestArgs>,
  ): Promise<SignatureFetcherState | undefined> {
    return this.main.getAccountFetcherState(ctx.params)
  }

  addAccountInfoFetcher(
    ctx: Context<AddAccountInfoFetcherRequestArgs>,
  ): Promise<void> {
    return this.main.addAccountInfoFetcher(ctx.params)
  }

  delAccountInfoFetcher(
    ctx: Context<FetcherAccountPartitionRequestArgs>,
  ): Promise<void> {
    return this.main.delAccountInfoFetcher(ctx.params)
  }

  fetchAccountTransactionsByDate(
    ctx: Context<FetchAccountTransactionsByDateRequestArgs>,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.main.fetchAccountTransactionsByDate(ctx.params)
  }

  fetchAccountTransactionsBySlot(
    ctx: Context<FetchAccountTransactionsBySlotRequestArgs>,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.main.fetchAccountTransactionsBySlot(ctx.params)
  }

  fetchTransactionsBySignature(
    ctx: Context<FetchTransactionsBySignatureRequestArgs>,
  ): Promise<void> {
    return this.main.fetchTransactionsBySignature(ctx.params)
  }

  getFetcherState(
    ctx: Context<FetcherStateRequestArgs>,
  ): Promise<FetcherState | undefined> {
    return this.main.getFetcherState(ctx.params)
  }

  getTransactionState(
    ctx: Context<CheckTransactionsRequestArgs>,
  ): Promise<TransactionState[]> {
    return this.main.getTransactionState(ctx.params)
  }
}
