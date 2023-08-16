import { PendingWork } from '../../index.js'
import {
  EntityStorage,
  EntityStorageOptions,
} from '../../../storage/entityStorage.js'
import {
  EntityUpdateCheckFnReturn,
  EntityUpdateOp,
  KeySchema,
} from '../../../storage/types.js'

export type PendingWorkStorageOptions<T> = Pick<
  EntityStorageOptions<PendingWork<T>>,
  'path' | 'count' | 'updateCheckFn'
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
      key: [{ get: (e) => e.id, length: EntityStorage.VariableLength }],
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
      async updateCheckFn(
        oldEntity: PendingWork<T> | undefined,
        newEntity: PendingWork<T>,
      ): Promise<EntityUpdateCheckFnReturn<PendingWork<T>>> {
        if (oldEntity) return { op: EntityUpdateOp.Keep }
        return { op: EntityUpdateOp.Update, entity: newEntity }
      },
      ...options,
    })
  }
}

export type PendingWorkDAL<T> = PendingWorkStorage<T>
