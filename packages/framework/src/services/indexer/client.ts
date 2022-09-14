import { ServiceBroker } from 'moleculer'
import {
  MsIds,
  getRegistryNodesWithService,
  waitForAllNodesWithService,
} from '../common.js'
import { IndexerMsI, PrivateIndexerMsI } from './interface.js'
import { TransactionRequest } from './src/dal/transactionRequest.js'
import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  InvokeMethodRequestArgs,
  GetAccountIndexingStateRequestArgs,
  GetTransactionPendingRequestsRequestArgs,
} from './src/types'

/**
 * Client to access the main indexer service through the broker.
 */
export class IndexerMsClient implements IndexerMsI, PrivateIndexerMsI {
  /**
   * @param broker The broker instance to retrieve the actual service from.
   * @param msId The moleculer service id of the indexer service.
   */
  constructor(
    protected broker: ServiceBroker,
    protected msId: MsIds = MsIds.Indexer,
  ) {}

  waitForAll(indexers: string[]): Promise<void> {
    return waitForAllNodesWithService(this.broker, indexers, this.msId)
  }

  getAllIndexers(): string[] {
    return getRegistryNodesWithService(this.broker, this.msId)
  }

  async indexAccount(
    args: AccountIndexerRequestArgs,
    broadcast = false,
  ): Promise<void> {
    if (broadcast) {
      const nodes = Object.keys(this.broker.registry.nodes.nodes)

      await Promise.all(
        nodes.map((nodeID) =>
          this.broker.call(
            `${this.msId}.indexAccount`,
            {
              partitionKey: args.partitionKey || args.account,
              ...args,
            },
            { nodeID },
          ),
        ),
      )

      return
    }

    return this.broker.call(`${this.msId}.indexAccount`, {
      partitionKey: args.partitionKey || args.account,
      ...args,
    })
  }

  getAccountState(
    args: GetAccountIndexingStateRequestArgs,
  ): Promise<AccountIndexerState | undefined> {
    return this.broker.call(`${this.msId}.getAccountState`, {
      partitionKey: args.partitionKey || args.account,
      ...args,
    })
  }

  invokeDomainMethod(args: InvokeMethodRequestArgs): Promise<unknown> {
    return this.broker.call(
      `${this.msId}.invokeDomainMethod`,
      {
        partitionKey: args.partitionKey || args.account,
        ...args,
      },
      { meta: { $streamObjectMode: true } },
    )
  }

  // Private API

  getTransactionRequests(
    args: GetTransactionPendingRequestsRequestArgs,
  ): Promise<TransactionRequest[]> {
    return this.broker.call(`${this.msId}.getTransactionRequests`, args, {
      nodeID: args.indexer,
    })
  }
}
