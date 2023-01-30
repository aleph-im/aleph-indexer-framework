import {
  BlockchainFetcherI,
  CheckEntityRequestArgs,
  DelEntityRequestArgs,
  FetcherState,
  FetcherStateRequestArgs,
  EntityState,
  AddAccountEntityRequestArgs,
  DelAccountEntityRequestArgs,
  GetAccountEntityStateRequestArgs,
  AccountEntityHistoryState,
  FetchAccountEntitiesByDateRequestArgs,
  FetchEntitiesByIdRequestArgs,
} from './types.js'
import { FetcherMsClient } from '../client.js'
import { Blockchain, IndexableEntityType } from '../../../types.js'
import { BaseEntityFetcherMain } from './entityFetcherMain.js'

/**
 * The main class of the fetcher service.
 */
export abstract class BaseFetcher implements BlockchainFetcherI {
  /**
   * Initialize the fetcher service.
   * @param blockchainId The blockchain identifier.
   * @param fetcherClient Allows communication with the sibling fetcher instances.
   * @param transactionHistoryFetcher It handles the account transactions tracking
   * @param transactionFetcher It handles transaction fetching by signatures
   * @param accountStateFetcher It handles the account state tracking
   */
  constructor(
    protected blockchainId: Blockchain,
    protected fetcherClient: FetcherMsClient,
    protected entityFetchers: Partial<
      Record<IndexableEntityType, BaseEntityFetcherMain<unknown>>
    >,
  ) {}

  async start(): Promise<void> {
    const entityFetchers = Object.values(this.entityFetchers)

    await Promise.all(
      entityFetchers.map((entityFetcher) => entityFetcher.start()),
    )
  }

  async stop(): Promise<void> {
    const entityFetchers = Object.values(this.entityFetchers)

    await Promise.all(
      entityFetchers.map((entityFetcher) => entityFetcher.stop()),
    )
  }

  async addAccountEntityFetcher(
    args: AddAccountEntityRequestArgs,
  ): Promise<void> {
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.addAccount(args)
  }

  async delAccountEntityFetcher(
    args: DelAccountEntityRequestArgs,
  ): Promise<void> {
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.delAccount(args)
  }

  async getAccountEntityFetcherState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<AccountEntityHistoryState<any> | undefined> {
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.getAccountState(args)
  }

  async getFetcherState({
    fetcher = this.fetcherClient.getNodeId(),
    type,
  }: FetcherStateRequestArgs): Promise<FetcherState> {
    const fetchers =
      type && type.length > 0
        ? type.map((id) => this.getEntityFetcherInstance(id))
        : Object.values(this.entityFetchers)

    return Promise.all(
      fetchers.map(async (entityFetcher) => {
        return {
          blockchain: this.blockchainId,
          fetcher,
          ...(await entityFetcher.getState()),
        }
      }),
    )
  }

  async fetchAccountEntitiesByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.fetchAccountEntitiesByDate(args)
  }

  async fetchEntitiesById(args: FetchEntitiesByIdRequestArgs): Promise<void> {
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.fetchEntitiesById(args)
  }

  async getEntityState(args: CheckEntityRequestArgs): Promise<EntityState[]> {
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.getEntityState(args)
  }

  async delEntityCache(args: DelEntityRequestArgs): Promise<void> {
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.delEntityCache(args)
  }

  protected getEntityFetcherInstance(
    type: IndexableEntityType,
  ): BaseEntityFetcherMain<unknown> {
    const entityFetcher = this.entityFetchers[type]
    if (!entityFetcher) throw new Error('Entity fetcher not implemented.')

    return entityFetcher
  }

  protected getFetcherId(): string {
    return this.fetcherClient.getNodeId()
  }
}
