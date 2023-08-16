import {
  EntityUpdateCheckFnReturn,
  EntityUpdateOp,
  PendingWork,
  PendingWorkStorage,
} from '@aleph-indexer/core'

export type PendingAccountStorage = PendingWorkStorage<string[]>

/**
 * Creates a new pending transaction storage for the fetcher.
 * @param path Path to the database.
 */
export function createPendingAccountDAL(
  path: string,
  name = 'fetcher_pending_account',
): PendingAccountStorage {
  return new PendingWorkStorage({
    name,
    path,
    count: true,
    async updateCheckFn(
      oldEntity: PendingWork<string[]> | undefined,
      newEntity: PendingWork<string[]>,
    ): Promise<EntityUpdateCheckFnReturn<PendingWork<string[]>>> {
      let entity = newEntity

      if (oldEntity) {
        const peers = new Set([
          ...(oldEntity.payload || []),
          ...(newEntity.payload || []),
        ])

        entity = {
          ...newEntity,
          payload: [...peers],
          time: oldEntity.time,
        }
      }

      return { op: EntityUpdateOp.Update, entity }
    },
  })
}
