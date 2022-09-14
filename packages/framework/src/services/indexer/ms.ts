import { ParsedTransactionV1 } from '@aleph-indexer/core'
import { ServiceBroker, Service, Context } from 'moleculer'
import { MsIds, MainFactory, shardBalancingStrategy } from '../common.js'
import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  GetAccountIndexingStateRequestArgs,
  InvokeMethodRequestArgs,
  GetTransactionPendingRequestsRequestArgs,
} from './src/types.js'
import { IndexerMsMain } from './main.js'
import { TransactionRequest } from './src/dal/transactionRequest.js'

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
      started: this.init,
    })
  }

  async init(): Promise<void> {
    return this.main.init()
  }

  async onTxs(chunk: ParsedTransactionV1[]): Promise<void> {
    return this.main.onTxs(chunk)
  }

  indexAccount(ctx: Context<AccountIndexerRequestArgs>): Promise<void> {
    this.logger.info('🏀', ctx.params.account)
    return this.main.indexAccount(ctx.params)
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
