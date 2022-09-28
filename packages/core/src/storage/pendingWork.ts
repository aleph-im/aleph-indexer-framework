import { PendingWork } from '../indexer/fetcher/types.js'
import { EntityStorage, EntityStorageOptions } from './entityStorage.js'
import { EntityUpdateOp, KeySchema } from './types.js'

export type PendingWorkStorageOptions<T> = Pick<
  EntityStorageOptions<PendingWork<T>>,
  'path' | 'count'
> & {
  name?: string
  sortedIndex?: {
    name: PendingWorkDALIndex.Sorted
    key: KeySchema<PendingWork<T>>
  }
}

export enum PendingWorkDALIndex {
  Sorted = 'sorted',
}

export class PendingWorkStorage<T> extends EntityStorage<PendingWork<T>> {
  constructor(options: PendingWorkStorageOptions<T>) {
    super({
      name: 'pending_work',
      primaryKey: [{ get: (e) => e.id, length: EntityStorage.VariableLength }],
      indexes: [
        options.sortedIndex || {
          name: PendingWorkDALIndex.Sorted,
          key: [
            {
              get: (e) => e.time,
              length: EntityStorage.TimestampLength,
            },
            {
              get: (e) => e.id,
              length: EntityStorage.VariableLength,
            },
          ],
        },
      ],
      ...options,
      async updateCheckFn(
        oldEntity: PendingWork<T> | undefined,
      ): Promise<EntityUpdateOp> {
        if (oldEntity) return EntityUpdateOp.Keep
        return EntityUpdateOp.Update
      },
    })
  }
}

export type PendingWorkDAL<T> = PendingWorkStorage<T>
