import { EntityStorage, EntityStorageOptions } from '@aleph-indexer/core'
import { IndexableEntityType, RawEntity } from '../../../../types.js'

export type RawEntityStorage<T extends RawEntity> = EntityStorage<T>

const idCaseSensitiveKey = {
  get: <T extends RawEntity>(e: T) => e.id,
  length: EntityStorage.VariableLength,
}

const idKey = {
  ...idCaseSensitiveKey,
  get: <T extends RawEntity>(e: T) => e.id.toLowerCase(),
}

/**
 * Creates a new raw transaction storage for the fetcher.
 * @param path Path to the database.
 */
export function createRawEntityDAL<T extends RawEntity>(
  path: string,
  type: IndexableEntityType,
  caseSensitive = true,
  options?: Partial<EntityStorageOptions<T>>,
  name = `fetcher_raw_${type}_entity`,
): RawEntityStorage<T> {
  return new EntityStorage<T>({
    name,
    path,
    key: [caseSensitive ? idCaseSensitiveKey : idKey],
    ...options,
  })
}
