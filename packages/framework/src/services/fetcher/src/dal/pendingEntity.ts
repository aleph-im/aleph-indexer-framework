import {
  EntityUpdateOp,
  PendingWork,
  PendingWorkStorage,
} from '@aleph-indexer/core'
import { IndexableEntityType } from '../../../../types.js'

export type PendingEntityStorage = PendingWorkStorage<string[]>

/**
 * Creates a new pending transaction storage for the fetcher.
 * @param path Path to the database.
 */
export function createPendingEntityDAL(
  path: string,
  type: IndexableEntityType,
  name = `fetcher_pending_${type}`,
): PendingEntityStorage {
  return new PendingWorkStorage({
    name,
    path,
    count: true,
    async updateCheckFn(
      oldEntity: PendingWork<string[]> | undefined,
      newEntity: PendingWork<string[]>,
    ): Promise<EntityUpdateOp> {
      if (oldEntity) {
        const peers = new Set([
          ...(oldEntity.payload || []),
          ...(newEntity.payload || []),
        ])

        newEntity.payload = [...peers]
        newEntity.time = oldEntity.time
      }

      return EntityUpdateOp.Update
    },
  })
}

export function createPendingEntityCacheDAL(
  path: string,
  type: IndexableEntityType,
): PendingEntityStorage {
  return createPendingEntityDAL(path, type, `fetcher_pending_${type}_cache`)
}

export function createPendingEntityFetchDAL(
  path: string,
  type: IndexableEntityType,
): PendingEntityStorage {
  return createPendingEntityDAL(path, type, `fetcher_pending_${type}_fetch`)
}
