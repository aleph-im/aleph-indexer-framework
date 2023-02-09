import { IndexableEntityType, RawEntity } from '../../../types.js'
import { BaseEntityFetcher } from './entityFetcher.js'
import { BaseEntityHistoryFetcher } from './entityHistoryFetcher.js'
import { AccountEntityHistoryStorageEntity } from './dal/accountEntityHistory.js'
import {
  AccountEntityFetcherMainState,
  AccountEntityHistoryState,
  AddAccountEntityRequestArgs,
  CheckEntityRequestArgs,
  DelAccountEntityRequestArgs,
  DelEntityRequestArgs,
  EntityState,
  FetchAccountEntitiesByDateRequestArgs,
  FetchEntitiesByIdRequestArgs,
  GetAccountEntityStateRequestArgs,
} from './types.js'

export class BaseEntityFetcherMain<
  CU,
  HE extends AccountEntityHistoryStorageEntity = AccountEntityHistoryStorageEntity,
  RE extends RawEntity = RawEntity,
> {
  constructor(
    protected type: IndexableEntityType,
    protected entityFetcher: BaseEntityFetcher<RE>,
    protected entityHistoryFetcher: BaseEntityHistoryFetcher<CU, HE>,
  ) {}

  async start(): Promise<void> {
    await this.entityFetcher.start()
    await this.entityHistoryFetcher.start()
  }

  async stop(): Promise<void> {
    await this.entityFetcher.stop()
    await this.entityHistoryFetcher.stop()
  }

  async addAccount(args: AddAccountEntityRequestArgs): Promise<void> {
    return this.entityHistoryFetcher.addAccount(args)
  }

  async delAccount(args: DelAccountEntityRequestArgs): Promise<void> {
    return this.entityHistoryFetcher.delAccount(args)
  }

  async getAccountState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<AccountEntityHistoryState<CU> | undefined> {
    return this.entityHistoryFetcher.getAccountState(args)
  }

  async getState(): Promise<AccountEntityFetcherMainState> {
    return {
      type: this.type,
      ...(await this.entityFetcher.getState()),
      ...(await this.entityHistoryFetcher.getState()),
    }
  }

  async fetchAccountEntitiesByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.entityHistoryFetcher.fetchAccountEntitiesByDate(args)
  }

  async fetchEntitiesById(args: FetchEntitiesByIdRequestArgs): Promise<void> {
    return this.entityFetcher.fetchEntitiesById(args)
  }

  async getEntityState(args: CheckEntityRequestArgs): Promise<EntityState[]> {
    return this.entityFetcher.getEntityState(args)
  }

  async delEntityCache(args: DelEntityRequestArgs): Promise<void> {
    return this.entityFetcher.delEntityCache(args)
  }
}
