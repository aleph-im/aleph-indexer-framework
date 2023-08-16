import {
  EntityStorage,
  EntityUpdateCheckFnReturn,
  EntityUpdateOp,
} from '@aleph-indexer/core'
import { IndexableEntityType, ParsedEntity } from '../../../../types.js'

export type EntitySignatureResponse = {
  id: string
  nonceIndexes: Record<string, number>
}

export type EntityParsedResponse<T extends ParsedEntity<unknown>> = T &
  EntitySignatureResponse

export type EntityRequestResponse<T extends ParsedEntity<unknown>> =
  | EntitySignatureResponse
  | EntityParsedResponse<T>

export type EntityRequestResponseStorage<T extends ParsedEntity<unknown>> =
  EntityStorage<EntityRequestResponse<T>>

export enum EntityRequestResponseDALIndex {
  NonceIndex = 'nonce_index',
}

const idKey = {
  get: (e: EntityRequestResponse<ParsedEntity<unknown>>) => e.id,
  length: EntityStorage.VariableLength,
}

const nonceKey = {
  get: (e: EntityRequestResponse<ParsedEntity<unknown>>) =>
    Object.keys(e.nonceIndexes || {}),
  length: EntityStorage.TimestampLength,
}

const indexKey = {
  get: (e: EntityRequestResponse<ParsedEntity<unknown>>, [nonce]: string[]) =>
    e.nonceIndexes[nonce],
  length: 8,
}

export function createEntityRequestResponseDAL<T extends ParsedEntity<unknown>>(
  path: string,
  type: IndexableEntityType,
): EntityRequestResponseStorage<T> {
  return new EntityStorage<EntityRequestResponse<T>>({
    name: `${type}_request_responses`,
    path,
    key: [idKey],
    indexes: [
      {
        name: EntityRequestResponseDALIndex.NonceIndex,
        key: [nonceKey, indexKey],
      },
    ],
    async updateCheckFn(
      oldEntity: EntityRequestResponse<T> | undefined,
      newEntity: EntityRequestResponse<T>,
    ): Promise<EntityUpdateCheckFnReturn<EntityRequestResponse<T>>> {
      let entity = newEntity

      if (oldEntity) {
        if (!('parsed' in newEntity) && 'parsed' in oldEntity) {
          entity = { ...oldEntity }
        }

        if ('parsed' in newEntity && !newEntity.nonceIndexes) {
          return { op: EntityUpdateOp.Delete }
        }

        // @note: This is a hack to make sure that the nonce indexes are
        // not overwritten by the new entity. This is usually the case when
        // the entity contains the actual transaction data, at which point we
        // do not have the actual nonce indexes, but still need to pass in a
        // nonce index object to the entity storage.
        entity.nonceIndexes = {
          ...newEntity.nonceIndexes,
          ...oldEntity.nonceIndexes,
        }
      }

      return { op: EntityUpdateOp.Update, entity }
    },
  })
}
