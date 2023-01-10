import { ServiceBroker } from 'moleculer'
import { Blockchain } from '@aleph-indexer/core'
import { MsIds } from '../../../common.js'
import { IndexerClientI } from '../../interface.js'
import { TransactionRequest } from './dal/transactionRequest.js'
import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  InvokeMethodRequestArgs,
  GetAccountIndexingStateRequestArgs,
  GetTransactionPendingRequestsRequestArgs,
} from './types'
import { BlockchainRequestArgs } from '../../../types.js'

/**
 * Client to access the main indexer service through the broker.
 */
export class BaseIndexerClient implements IndexerClientI {
  /**
   * @param blockchainId The id of the blockchain the client handles
   * @param broker The broker instance to retrieve the actual service from.
   * @param msId The moleculer service id of the indexer service.
   */
  constructor(
    protected blockchainId: Blockchain,
    protected broker: ServiceBroker,
    protected msId: MsIds = MsIds.Indexer,
  ) {}

  async indexAccount(
    args: Omit<AccountIndexerRequestArgs, keyof BlockchainRequestArgs>,
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
              blockchainId: this.blockchainId,
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
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  async deleteAccount(
    args: Omit<AccountIndexerRequestArgs, keyof BlockchainRequestArgs>,
    broadcast = false,
  ): Promise<void> {
    if (broadcast) {
      const nodes = Object.keys(this.broker.registry.nodes.nodes)

      await Promise.all(
        nodes.map((nodeID) =>
          this.broker.call(
            `${this.msId}.deleteAccount`,
            {
              partitionKey: args.partitionKey || args.account,
              blockchainId: this.blockchainId,
              ...args,
            },
            { nodeID },
          ),
        ),
      )

      return
    }

    return this.broker.call(`${this.msId}.deleteAccount`, {
      partitionKey: args.partitionKey || args.account,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  getAccountState(
    args: Omit<GetAccountIndexingStateRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<AccountIndexerState | undefined> {
    return this.broker.call(`${this.msId}.getAccountState`, {
      partitionKey: args.partitionKey || args.account,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  invokeDomainMethod(
    args: Omit<InvokeMethodRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<unknown> {
    return this.broker.call(
      `${this.msId}.invokeDomainMethod`,
      {
        partitionKey: args.partitionKey || args.account,
        blockchainId: this.blockchainId,
        ...args,
      },
      { meta: { $streamObjectMode: true }, nodeID: args.indexer },
    )
  }

  // Private API

  getTransactionRequests(
    args: Omit<
      GetTransactionPendingRequestsRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<TransactionRequest[]> {
    return this.broker.call(
      `${this.msId}.getTransactionRequests`,
      {
        blockchainId: this.blockchainId,
        ...args,
      },
      { nodeID: args.indexer },
    )
  }
}
