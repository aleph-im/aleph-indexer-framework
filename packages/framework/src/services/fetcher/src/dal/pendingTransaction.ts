import {
  EntityUpdateOp,
  PendingWork,
  PendingWorkStorage,
} from '@aleph-indexer/core'

export type PendingTransactionStorage = PendingWorkStorage<string[]>

/**
 * Creates a new pending transaction storage for the fetcher.
 * @param path Path to the database.
 */
export function createPendingTransactionDAL(
  path: string,
  name = 'fetcher_pending_transactions',
): PendingTransactionStorage {
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

export function createPendingTransactionCacheDAL(
  path: string,
): PendingTransactionStorage {
  return createPendingTransactionDAL(path, 'fetcher_pending_transactions_cache')
}

export function createPendingTransactionFetchDAL(
  path: string,
): PendingTransactionStorage {
  return createPendingTransactionDAL(path, 'fetcher_pending_transactions_fetch')
}
