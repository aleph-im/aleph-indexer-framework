import {
  EntityUpdateCheckFnReturn,
  EntityUpdateOp,
  PendingWork,
  PendingWorkStorage,
} from '@aleph-indexer/core'
import { IndexableEntityType, ParsedEntity } from '../../../../types.js'

export type EntityRequestIncomingEntityStorage<
  T extends ParsedEntity<unknown>,
> = PendingWorkStorage<T>

/**
 * Creates a new pending transaction storage for the fetcher.
 * @param path Path to the database.
 */
export function createEntityRequestIncomingEntityDAL<
  T extends ParsedEntity<unknown>,
>(
  path: string,
  type: IndexableEntityType,
): EntityRequestIncomingEntityStorage<T> {
  return new PendingWorkStorage({
    name: `${type}_request_incoming_entities`,
    path,
    count: true,
    async updateCheckFn(
      oldEntity: PendingWork<T> | undefined,
      newEntity: PendingWork<T>,
    ): Promise<EntityUpdateCheckFnReturn<PendingWork<T>>> {
      let entity = newEntity

      if (oldEntity) {
        entity = {
          ...newEntity,
          time: oldEntity.time,
        }
      }

      return { op: EntityUpdateOp.Update, entity }
    },
  })
}
