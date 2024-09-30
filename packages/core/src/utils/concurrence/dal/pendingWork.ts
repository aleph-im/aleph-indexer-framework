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

const idKey = {
  get: (e: PendingWork<unknown>) => e.id,
  length: EntityStorage.VariableLength,
}

const timeKey = {
  get: (e: PendingWork<unknown>) => e.time,
  length: EntityStorage.TimestampLength,
}

export class PendingWorkStorage<T> extends EntityStorage<PendingWork<T>> {
  constructor(options: PendingWorkStorageOptions<T>) {
    super({
      name: 'pending_work',
      key: [idKey],
      indexes: [
        options.sortedIndex || {
          name: PendingWorkDALIndex.Sorted,
          key: [timeKey, idKey],
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
