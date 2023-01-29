import {
  AccountEntityHistoryDALIndex,
  AccountEntityHistoryStorage,
  AccountEntityHistoryStorageEntity,
} from './accountEntityHistory.js'

export type AccountTransactionHistoryStorageEntity =
  AccountEntityHistoryStorageEntity & {
    signature: string
  }

export type AccountTransactionHistoryStorage<
  T extends AccountTransactionHistoryStorageEntity,
> = AccountEntityHistoryStorage<T>

export const AccountTransactionHistoryDALIndex = AccountEntityHistoryDALIndex
