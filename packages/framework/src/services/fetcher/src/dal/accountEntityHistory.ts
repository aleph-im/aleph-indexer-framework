import { EntityStorage } from '@aleph-indexer/core'

export type AccountEntityHistoryStorageEntity = {
  accounts: string[]
}

export type AccountEntityHistoryStorage<
  T extends AccountEntityHistoryStorageEntity,
> = EntityStorage<T>

export enum AccountEntityHistoryDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
}
