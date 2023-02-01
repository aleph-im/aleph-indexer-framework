import {
  EntityStorage,
  EntityStorageOptions,
  EntityUpdateOp,
} from '@aleph-indexer/core'
import { IndexableEntityType } from '../../../../types.js'

export type AccountEntityHistoryStorageEntity = {
  id: string
  timestamp: number // in millis
  accounts: string[]
  index?: number
}

export type AccountEntityHistoryStorage<
  T extends AccountEntityHistoryStorageEntity,
> = EntityStorage<T>

export enum AccountEntityHistoryDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
}

const idCaseSensitiveKey = {
  get: <T extends AccountEntityHistoryStorageEntity>(e: T) => e.id,
  length: EntityStorage.VariableLength,
}

const idKey = {
  ...idCaseSensitiveKey,
  get: <T extends AccountEntityHistoryStorageEntity>(e: T) =>
    e.id.toLowerCase(),
}

const accountCaseSensitiveKey = {
  get: <T extends AccountEntityHistoryStorageEntity>(e: T) => e.accounts,
  length: EntityStorage.VariableLength,
}

const accountKey = {
  get: <T extends AccountEntityHistoryStorageEntity>(e: T) =>
    e.accounts.map((acc) => acc.toLowerCase()),
  length: EntityStorage.VariableLength,
}

const timestampKey = {
  get: <T extends AccountEntityHistoryStorageEntity>(e: T) => e.timestamp, // millis
  length: EntityStorage.TimestampLength,
}

const indexKey = {
  get: <T extends AccountEntityHistoryStorageEntity>(e: T) => e.index,
  // @note: up to 999 items per timestamp chunk
  length: 3,
}

export const AccountEntityHistoryDALKeys = {
  idCaseSensitiveKey,
  idKey,
  accountCaseSensitiveKey,
  accountKey,
  timestampKey,
  indexKey,
}

/**
 * @param path Path to the database.
 */
export function createAccountEntityHistoryDAL<
  T extends AccountEntityHistoryStorageEntity,
>(
  path: string,
  type: IndexableEntityType,
  caseSensitive = true,
  options?: Partial<EntityStorageOptions<T>>,
  name = `fetcher_account_${type}_history`,
): AccountEntityHistoryStorage<T> {
  return new EntityStorage<T>({
    name,
    path,
    key: [caseSensitive ? idCaseSensitiveKey : idKey],
    ...options,
    indexes: [
      {
        name: AccountEntityHistoryDALIndex.AccountTimestampIndex,
        key: [
          caseSensitive ? accountCaseSensitiveKey : accountKey,
          timestampKey,
          indexKey,
        ],
      },
      ...(options?.indexes || []),
    ],
    async updateCheckFn(
      oldEntity: T | undefined,
      newEntity: T,
    ): Promise<EntityUpdateOp> {
      if (oldEntity) {
        const accounts = new Set([
          ...(oldEntity.accounts || []),
          ...(newEntity.accounts || []),
        ])
        newEntity.accounts = [...accounts]
      }

      return EntityUpdateOp.Update
    },
  })
}
