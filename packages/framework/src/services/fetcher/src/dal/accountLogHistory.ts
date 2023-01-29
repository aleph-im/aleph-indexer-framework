import {
  AccountEntityHistoryDALIndex,
  AccountEntityHistoryStorage,
  AccountEntityHistoryStorageEntity,
} from './accountEntityHistory.js'

export type AccountLogHistoryStorageEntity =
  AccountEntityHistoryStorageEntity & {
    signature: string
  }

export type AccountLogHistoryStorage<T extends AccountLogHistoryStorageEntity> =
  AccountEntityHistoryStorage<T>

export const AccountLogHistoryDALIndex = AccountEntityHistoryDALIndex
