import { ServiceBroker, Context, Service } from 'moleculer'
import { MsIds, MainFactory, shardBalancingStrategy } from '../common.js'
import { FetcherMsMain } from './main.js'
import {
  AddAccountStateRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetcherState,
  FetcherStateRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  AddAccountTransactionRequestArgs,
  GetAccountTransactionStateRequestArgs,
  DelAccountTransactionRequestArgs,
  GetAccountStateStateRequestArgs,
  AccountTransactionHistoryState,
  AccountStateState,
  DelAccountStateRequestArgs,
} from './src/base/types.js'
import { InvokeBlockchainMethodRequestArgs } from '../types.js'

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
        addAccountTransactionFetcher: {
          ...shardBalancingStrategy,
          handler: this.addAccountTransactionFetcher,
        },
        delAccountTransactionFetcher: {
          ...shardBalancingStrategy,
          handler: this.delAccountTransactionFetcher,
        },
        getAccountTransactionFetcherState: {
          ...shardBalancingStrategy,
          handler: this.getAccountTransactionFetcherState,
        },
        addAccountStateFetcher: {
          ...shardBalancingStrategy,
          handler: this.addAccountStateFetcher,
        },
        delAccountStateFetcher: {
          ...shardBalancingStrategy,
          handler: this.delAccountStateFetcher,
        },
        getAccountStateFetcherState: {
          ...shardBalancingStrategy,
          handler: this.getAccountStateFetcherState,
        },
        fetchAccountTransactionsByDate: {
          ...shardBalancingStrategy,
          handler: this.fetchAccountTransactionsByDate,
        },
        fetchTransactionsBySignature: {
          ...shardBalancingStrategy,
          handler: this.fetchTransactionsBySignature,
        },
        getFetcherState: {
          ...shardBalancingStrategy,
          handler: this.getFetcherState,
        },
        invokeBlockchainMethod: {
          ...shardBalancingStrategy,
          handler: this.invokeBlockchainMethod,
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

  addAccountTransactionFetcher(
    ctx: Context<AddAccountTransactionRequestArgs>,
  ): Promise<void> {
    return this.main.addAccountTransactionFetcher(ctx.params)
  }

  delAccountTransactionFetcher(
    ctx: Context<DelAccountTransactionRequestArgs>,
  ): Promise<void> {
    return this.main.delAccountTransactionFetcher(ctx.params)
  }

  getAccountTransactionFetcherState(
    ctx: Context<GetAccountTransactionStateRequestArgs>,
  ): Promise<AccountTransactionHistoryState<unknown> | undefined> {
    return this.main.getAccountTransactionFetcherState(ctx.params)
  }

  addAccountStateFetcher(
    ctx: Context<AddAccountStateRequestArgs>,
  ): Promise<void> {
    return this.main.addAccountStateFetcher(ctx.params)
  }

  delAccountStateFetcher(
    ctx: Context<DelAccountStateRequestArgs>,
  ): Promise<void> {
    return this.main.delAccountStateFetcher(ctx.params)
  }

  getAccountStateFetcherState(
    ctx: Context<GetAccountStateStateRequestArgs>,
  ): Promise<AccountStateState<unknown> | undefined> {
    return this.main.getAccountStateFetcherState(ctx.params)
  }

  fetchAccountTransactionsByDate(
    ctx: Context<FetchAccountTransactionsByDateRequestArgs>,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.main.fetchAccountTransactionsByDate(ctx.params)
  }

  fetchTransactionsBySignature(
    ctx: Context<FetchTransactionsBySignatureRequestArgs>,
  ): Promise<void> {
    return this.main.fetchTransactionsBySignature(ctx.params)
  }

  getFetcherState(
    ctx: Context<FetcherStateRequestArgs>,
  ): Promise<FetcherState[]> {
    return this.main.getFetcherState(ctx.params)
  }

  invokeBlockchainMethod(
    ctx: Context<InvokeBlockchainMethodRequestArgs<unknown>>,
  ): Promise<unknown> {
    return this.main.invokeBlockchainMethod(ctx.params)
  }
}
