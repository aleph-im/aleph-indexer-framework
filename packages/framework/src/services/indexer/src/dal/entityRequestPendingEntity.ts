import {
  EntityStorage,
  EntityUpdateCheckFnReturn,
  EntityUpdateOp,
} from '@aleph-indexer/core'
import { IndexableEntityType } from '../../../../types.js'

export type EntityRequestPendingEntity = {
  id: string
  nonces: number[]
}

export type EntityRequestPendingEntityStorage =
  EntityStorage<EntityRequestPendingEntity>

export enum EntityRequestPendingEntityDALIndex {
  Nonce = 'nonce',
}

const idKey = {
  get: (e: EntityRequestPendingEntity) => e.id,
  length: EntityStorage.VariableLength,
}

const nonceKey = {
  get: (e: EntityRequestPendingEntity) => e.nonces,
  length: EntityStorage.TimestampLength,
}

export function createEntityRequestPendingEntityDAL(
  path: string,
  type: IndexableEntityType,
): EntityRequestPendingEntityStorage {
  return new EntityStorage<EntityRequestPendingEntity>({
    name: `${type}_request_pending_signatures`,
    path,
    key: [idKey],
    indexes: [
      {
        name: EntityRequestPendingEntityDALIndex.Nonce,
        key: [nonceKey],
      },
    ],
    async updateCheckFn(
      oldEntity: EntityRequestPendingEntity | undefined,
      newEntity: EntityRequestPendingEntity,
    ): Promise<EntityUpdateCheckFnReturn<EntityRequestPendingEntity>> {
      let entity = newEntity

      if (oldEntity) {
        const ts = new Set([
          ...(oldEntity.nonces || []),
          ...(newEntity.nonces || []),
        ])

        entity = {
          ...newEntity,
          nonces: [...ts],
        }
      }

      return { op: EntityUpdateOp.Update, entity }
    },
  })
}
