import { ServiceBroker, Service, Context } from 'moleculer'
import { MsIds, MainFactory, shardBalancingStrategy } from '../common.js'
import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  GetAccountIndexingEntityStateRequestArgs,
  InvokeMethodRequestArgs,
  GetEntityPendingRequestsRequestArgs,
} from './src/types.js'
import { IndexerMsMain } from './main.js'
import { EntityRequest } from './src/dal/entityRequest.js'

/**
 * A wrapper of the Molueculer service to expose the main indexer service through the broker.
 */
export class IndexerMs extends Service {
  public static mainFactory: MainFactory<IndexerMsMain>

  protected main!: IndexerMsMain

  constructor(broker: ServiceBroker) {
    super(broker)

    this.main = IndexerMs.mainFactory(broker)

    this.parseServiceSchema({
      name: MsIds.Indexer,
      actions: {
        indexAccount: {
          ...shardBalancingStrategy,
          handler: this.indexAccount,
        },
        deleteAccount: {
          ...shardBalancingStrategy,
          handler: this.deleteAccount,
        },
        getAccountState: {
          ...shardBalancingStrategy,
          handler: this.getAccountState,
        },
        invokeDomainMethod: {
          ...shardBalancingStrategy,
          handler: this.invokeDomainMethod,
        },
        getEntityPendingRequests: {
          ...shardBalancingStrategy,
          handler: this.getEntityPendingRequests,
        },
      },
      started: this.start,
      stopped: this.stop,
    })
  }

  async start(): Promise<void> {
    return this.main.start()
  }

  async stop(): Promise<void> {
    return this.main.stop()
  }

  indexAccount(ctx: Context<AccountIndexerRequestArgs>): Promise<void> {
    return this.main.indexAccount(ctx.params)
  }

  deleteAccount(ctx: Context<AccountIndexerRequestArgs>): Promise<void> {
    return this.main.deleteAccount(ctx.params)
  }

  getAccountState(
    ctx: Context<GetAccountIndexingEntityStateRequestArgs>,
  ): Promise<AccountIndexerState | undefined> {
    return this.main.getAccountState(ctx.params)
  }

  invokeDomainMethod(ctx: Context<InvokeMethodRequestArgs>): Promise<unknown> {
    return this.main.invokeDomainMethod(ctx.params)
  }

  getEntityPendingRequests(
    ctx: Context<GetEntityPendingRequestsRequestArgs>,
  ): Promise<EntityRequest[]> {
    return this.main.getEntityPendingRequests(ctx.params)
  }
}
