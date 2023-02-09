import { EntityStorage } from '@aleph-indexer/core'
import { IndexableEntityType } from '../../../../types.js'

export enum EntityRequestType {
  ByDateRange = 0,
  ById = 1,
}

export type EntityRequestDateRange = {
  type: EntityRequestType.ByDateRange
  params: {
    account: string
    startDate: number
    endDate: number
  }
}

export type EntityRequestId = {
  type: EntityRequestType.ById
  params: { ids: string[] }
}

export type EntityRequestParams = EntityRequestDateRange | EntityRequestId

export type EntityRequest = {
  nonce: number
  count: number
  complete?: boolean
  // type: TransactionRequestType
  // params: TransactionRequestParams
} & EntityRequestParams

export type EntityRequestStorage = EntityStorage<EntityRequest>

const nonceKey = {
  get: (e: EntityRequest) => e.nonce,
  length: EntityStorage.TimestampLength,
}

export function createEntityRequestDAL(
  path: string,
  type: IndexableEntityType,
): EntityRequestStorage {
  return new EntityStorage<EntityRequest>({
    name: `${type}_requests`,
    path,
    key: [nonceKey],
  })
}
