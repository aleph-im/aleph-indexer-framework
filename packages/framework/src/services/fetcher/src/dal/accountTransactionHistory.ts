import { EntityStorage } from '@aleph-indexer/core'

export type AccountTransactionHistoryStorageEntity = {
  signature: string
  accounts: string[]
}

export type AccountTransactionHistoryStorage<
  T extends AccountTransactionHistoryStorageEntity,
> = EntityStorage<T>

export enum AccountTransactionHistoryDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
}
