import { ServiceBroker } from 'moleculer'
import { Blockchain, IndexableEntityType } from '../../../types.js'
import { MsIds } from '../../common.js'
import {
  BlockchainRequestArgs,
  InvokeBlockchainMethodRequestArgs,
} from '../../types.js'
import { FetcherClientI } from '../interface.js'
import {
  FetcherStateRequestArgs,
  FetcherState,
  EntityState,
  CheckEntityRequestArgs,
  DelEntityRequestArgs,
  AddAccountEntityRequestArgs,
  GetAccountEntityStateRequestArgs,
  DelAccountEntityRequestArgs,
  AccountEntityHistoryState,
  FetchAccountEntitiesByDateRequestArgs,
  FetchEntitiesByIdRequestArgs,
} from './types.js'

/**
 * Client to access the main fetcher service through the broker.
 */
export abstract class BaseFetcherClient implements FetcherClientI {
  /**
   * @param blockchainId The id of the blockchain the client handles
   * @param broker The broker instance to retrieve the actual service from.
   * @param msId The moleculer service id of the fetcher service.
   */
  constructor(
    protected blockchainId: Blockchain,
    protected broker: ServiceBroker,
    protected msId: MsIds = MsIds.Fetcher,
  ) {}

  addAccountEntityFetcher(
    args: Omit<AddAccountEntityRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void> {
    return this.broker.call(`${this.msId}.addAccountEntityFetcher`, {
      partitionKey: args.account,
      indexerId: this.broker.nodeID,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  delAccountEntityFetcher(
    args: Omit<DelAccountEntityRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void> {
    return this.broker.call(`${this.msId}.delAccountEntityFetcher`, {
      partitionKey: args.account,
      indexerId: this.broker.nodeID,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  getAccountEntityFetcherState(
    args: Omit<GetAccountEntityStateRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<AccountEntityHistoryState<unknown> | undefined> {
    return this.broker.call(`${this.msId}.getAccountEntityFetcherState`, {
      partitionKey: args.account,
      indexerId: this.broker.nodeID,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  fetchAccountEntitiesByDate(
    args: Omit<
      FetchAccountEntitiesByDateRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.broker.call(`${this.msId}.fetchAccountEntitiesByDate`, {
      partitionKey: args.account,
      indexerId: this.broker.nodeID,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  async fetchEntitiesById(
    args: Omit<FetchEntitiesByIdRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void> {
    const groups = this.getEntityPartitionGroups(args)

    await Promise.all(
      Object.entries(groups).map(([partitionKey, signatures]) => {
        return this.broker.call(`${this.msId}.fetchEntitiesById`, {
          indexerId: this.broker.nodeID,
          blockchainId: this.blockchainId,
          ...args,
          partitionKey,
          signatures,
        })
      }),
    )
  }

  async getFetcherState(
    args: Omit<FetcherStateRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<FetcherState> {
    return this.broker.call(`${this.msId}.getFetcherState`, args, {
      nodeID: args.fetcher,
    })
  }

  async getEntityState({
    ids,
  }: CheckEntityRequestArgs): Promise<EntityState[]> {
    const groups = this.getEntityPartitionGroups({ ids })

    const states = (await Promise.all(
      Object.entries(groups).map(([partitionKey, ids]) => {
        return this.broker.call(`${this.msId}.getEntityState`, {
          partitionKey,
          ids,
        })
      }),
    )) as EntityState[][]

    return states.flatMap((state) => state)
  }

  async delEntityCache({ ids }: DelEntityRequestArgs): Promise<void> {
    const groups = this.getEntityPartitionGroups({ ids })

    await Promise.all(
      Object.entries(groups).map(([partitionKey, ids]) => {
        return this.broker.call(`${this.msId}.delEntityCache`, {
          partitionKey,
          ids,
        })
      }),
    )
  }

  protected invokeBlockchainMethod<R, A>(
    args: Omit<
      InvokeBlockchainMethodRequestArgs<A>,
      keyof BlockchainRequestArgs
    >,
  ): Promise<R> {
    return this.broker.call(`${this.msId}.invokeBlockchainMethod`, {
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  protected getEntityPartitionGroups(args: {
    ids: string[]
    partitionKey?: string
  }): Record<string, string[]> {
    const partitionGroups = args.partitionKey
      ? { [args.partitionKey]: args.ids }
      : args.ids.reduce((acc, curr) => {
          const k = curr.charAt(0)
          const group = (acc[k] = acc[k] || [])
          group.push(curr)
          return acc
        }, {} as Record<string, string[]>)

    return partitionGroups
  }
}
