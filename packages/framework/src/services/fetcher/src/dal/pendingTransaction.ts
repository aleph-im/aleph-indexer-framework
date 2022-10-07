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
): PendingTransactionStorage {
  return new PendingWorkStorage({
    name: 'fetcher_pending_transactions',
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
      }

      return EntityUpdateOp.Update
    },
  })
}
