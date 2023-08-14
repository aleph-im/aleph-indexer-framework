import { ServiceBroker } from 'moleculer'
import { MsIds } from '../../common.js'
import { IndexerClientI } from '../interface.js'
import { EntityRequest } from './dal/entityRequest.js'
import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  InvokeMethodRequestArgs,
  GetAccountIndexingEntityStateRequestArgs,
  GetEntityPendingRequestsRequestArgs,
} from './types.js'
import { BlockchainRequestArgs } from '../../types.js'
import { BlockchainId, IndexableEntityType } from '../../../types.js'

/**
 * Client to access the main indexer service through the broker.
 */
export abstract class BaseIndexerClient implements IndexerClientI {
  /**
   * @param blockchainId The id of the blockchain the client handles
   * @param broker The broker instance to retrieve the actual service from.
   * @param msId The moleculer service id of the indexer service.
   */
  constructor(
    protected blockchainId: BlockchainId,
    protected broker: ServiceBroker,
    protected msId: MsIds = MsIds.Indexer,
  ) {}

  abstract normalizeAccount(account: string): string

  abstract normalizeEntityId(entity: IndexableEntityType, id: string): string

  async indexAccount(
    args: Omit<AccountIndexerRequestArgs, keyof BlockchainRequestArgs>,
    broadcast = false,
  ): Promise<void> {
    const account = this.normalizeAccount(args.account)

    if (broadcast) {
      const nodes = Object.keys(this.broker.registry.nodes.nodes)

      await Promise.all(
        nodes.map((nodeID) =>
          this.broker.call(
            `${this.msId}.indexAccount`,
            {
              partitionKey: args.partitionKey || account,
              blockchainId: this.blockchainId,
              ...args,
              account,
            },
            { nodeID },
          ),
        ),
      )

      return
    }

    return this.broker.call(`${this.msId}.indexAccount`, {
      partitionKey: args.partitionKey || account,
      blockchainId: this.blockchainId,
      ...args,
      account,
    })
  }

  async deleteAccount(
    args: Omit<AccountIndexerRequestArgs, keyof BlockchainRequestArgs>,
    broadcast = false,
  ): Promise<void> {
    const account = this.normalizeAccount(args.account)

    if (broadcast) {
      const nodes = Object.keys(this.broker.registry.nodes.nodes)

      await Promise.all(
        nodes.map((nodeID) =>
          this.broker.call(
            `${this.msId}.deleteAccount`,
            {
              partitionKey: args.partitionKey || account,
              blockchainId: this.blockchainId,
              ...args,
              account,
            },
            { nodeID },
          ),
        ),
      )

      return
    }

    return this.broker.call(`${this.msId}.deleteAccount`, {
      partitionKey: args.partitionKey || account,
      blockchainId: this.blockchainId,
      ...args,
      account,
    })
  }

  getAccountState(
    args: Omit<
      GetAccountIndexingEntityStateRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<AccountIndexerState | undefined> {
    const account = this.normalizeAccount(args.account)

    return this.broker.call(`${this.msId}.getAccountState`, {
      partitionKey: args.partitionKey || account,
      blockchainId: this.blockchainId,
      ...args,
      account,
    })
  }

  invokeDomainMethod(
    args: Omit<InvokeMethodRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<unknown> {
    const account = this.normalizeAccount(args.account)

    return this.broker.call(
      `${this.msId}.invokeDomainMethod`,
      {
        partitionKey: args.partitionKey || account,
        blockchainId: this.blockchainId,
        ...args,
        account,
      },
      { meta: { $streamObjectMode: true }, nodeID: args.indexer },
    )
  }

  // Private API

  getEntityPendingRequests(
    args: Omit<
      GetEntityPendingRequestsRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<EntityRequest[]> {
    const account = args.account
      ? this.normalizeAccount(args.account)
      : args.account

    return this.broker.call(
      `${this.msId}.getEntityPendingRequests`,
      {
        blockchainId: this.blockchainId,
        ...args,
        account,
      },
      { nodeID: args.indexer },
    )
  }
}
