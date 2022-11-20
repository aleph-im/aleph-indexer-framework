import {
  EntityUpdateOp,
  PendingWork,
  PendingWorkStorage,
} from '@aleph-indexer/core'

export type AccountStorage = PendingWorkStorage<string[]>

/**
 * Creates a new pending transaction storage for the fetcher.
 * @param path Path to the database.
 */
export function createAccountDAL(
  path: string,
  name = 'fetcher_accounts',
): AccountStorage {
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
