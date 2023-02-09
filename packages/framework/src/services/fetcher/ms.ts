import { ServiceBroker, Context, Service } from 'moleculer'
import { MsIds, MainFactory, shardBalancingStrategy } from '../common.js'
import { FetcherMsMain } from './main.js'
import {
  FetchAccountEntitiesByDateRequestArgs,
  FetcherState,
  FetcherStateRequestArgs,
  FetchEntitiesByIdRequestArgs,
  AddAccountEntityRequestArgs,
  GetAccountEntityStateRequestArgs,
  DelAccountEntityRequestArgs,
  AccountEntityHistoryState,
} from './src/types.js'
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
        addAccountEntityFetcher: {
          ...shardBalancingStrategy,
          handler: this.addAccountEntityFetcher,
        },
        delAccountEntityFetcher: {
          ...shardBalancingStrategy,
          handler: this.delAccountEntityFetcher,
        },
        getAccountEntityFetcherState: {
          ...shardBalancingStrategy,
          handler: this.getAccountEntityFetcherState,
        },
        fetchAccountEntitiesByDate: {
          ...shardBalancingStrategy,
          handler: this.fetchAccountEntitiesByDate,
        },
        fetchEntitiesById: {
          ...shardBalancingStrategy,
          handler: this.fetchEntitiesById,
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

  addAccountEntityFetcher(
    ctx: Context<AddAccountEntityRequestArgs>,
  ): Promise<void> {
    return this.main.addAccountEntityFetcher(ctx.params)
  }

  delAccountEntityFetcher(
    ctx: Context<DelAccountEntityRequestArgs>,
  ): Promise<void> {
    return this.main.delAccountEntityFetcher(ctx.params)
  }

  getAccountEntityFetcherState(
    ctx: Context<GetAccountEntityStateRequestArgs>,
  ): Promise<AccountEntityHistoryState<unknown> | undefined> {
    return this.main.getAccountEntityFetcherState(ctx.params)
  }

  fetchAccountEntitiesByDate(
    ctx: Context<FetchAccountEntitiesByDateRequestArgs>,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.main.fetchAccountEntitiesByDate(ctx.params)
  }

  fetchEntitiesById(ctx: Context<FetchEntitiesByIdRequestArgs>): Promise<void> {
    return this.main.fetchEntitiesById(ctx.params)
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
