import {
  EntityUpdateCheckFnReturn,
  EntityUpdateOp,
  PendingWork,
  PendingWorkStorage,
} from '@aleph-indexer/core'

export type PendingAccountPayload = {
  peers: string[]
  params?: Record<string, unknown>
}

export type PendingAccountStorage = PendingWorkStorage<PendingAccountPayload>

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
      oldEntity: PendingWork<PendingAccountPayload> | undefined,
      newEntity: PendingWork<PendingAccountPayload>,
    ): Promise<EntityUpdateCheckFnReturn<PendingWork<PendingAccountPayload>>> {
      let entity = newEntity

      if (oldEntity) {
        const peers = new Set([
          ...(oldEntity.payload.peers || []),
          ...(newEntity.payload.peers || []),
        ])

        entity = { ...newEntity }
        entity.time = oldEntity.time
        entity.payload.peers = [...peers]
      }

      return { op: EntityUpdateOp.Update, entity }
    },
  })
}
