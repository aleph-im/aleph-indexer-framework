import { ServiceBroker, Service, Context } from 'moleculer'
import { MsIds, MainFactory, shardBalancingStrategy } from '../common.js'
import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  GetAccountIndexingStateRequestArgs,
  InvokeMethodRequestArgs,
  GetTransactionPendingRequestsRequestArgs,
} from './src/base/types.js'
import { IndexerMsMain } from './main.js'
import { TransactionRequest } from './src/base/dal/transactionRequest.js'

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
        getTransactionRequests: {
          ...shardBalancingStrategy,
          handler: this.getTransactionRequests,
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
    this.logger.info('🏀', ctx.params.account)
    return this.main.deleteAccount(ctx.params)
  }

  getAccountState(
    ctx: Context<GetAccountIndexingStateRequestArgs>,
  ): Promise<AccountIndexerState | undefined> {
    return this.main.getAccountState(ctx.params)
  }

  invokeDomainMethod(ctx: Context<InvokeMethodRequestArgs>): Promise<unknown> {
    return this.main.invokeDomainMethod(ctx.params)
  }

  getTransactionRequests(
    ctx: Context<GetTransactionPendingRequestsRequestArgs>,
  ): Promise<TransactionRequest[]> {
    return this.main.getTransactionRequests(ctx.params)
  }
}
