import p from 'node:path'
import { EntityStorage } from '@aleph-indexer/core'
import { IndexableEntityType } from '../../../../types.js'

export enum EntityIndexerStateCode {
  Pending = 0,
  Ready = 1,
  Processed = 2,
}

export type EntityIndexerState = {
  account: string
  startDate: number
  endDate: number
} & (
  | {
      state: EntityIndexerStateCode.Processed
      requestNonce?: number
    }
  | {
      state: EntityIndexerStateCode.Pending | EntityIndexerStateCode.Ready
      requestNonce: number
    }
)

export type EntityIndexerStateStorage = EntityStorage<EntityIndexerState>

export enum EntityIndexerStateDALIndex {
  RequestState = 'request_state',
  AccountState = 'account_state',
}

const accountKey = {
  get: (e: EntityIndexerState) => e.account,
  length: EntityStorage.AddressLength,
}

const startDateKey = {
  get: (e: EntityIndexerState) => e.startDate,
  length: EntityStorage.TimestampLength,
}

const endDateKey = {
  get: (e: EntityIndexerState) => e.endDate,
  length: EntityStorage.TimestampLength,
}

const stateKey = {
  get: (e: EntityIndexerState) => e.state || EntityIndexerStateCode.Pending,
  length: 1,
}

const requestKey = {
  get: (e: EntityIndexerState) => e.requestNonce,
  length: EntityStorage.TimestampLength,
}

export function createEntityIndexerStateDAL(
  path: string,
  type: IndexableEntityType,
  account: string,
): EntityIndexerStateStorage {
  path = p.join(path, `${type}_indexer_state`)

  return new EntityStorage<EntityIndexerState>({
    name: `${account}`,
    path,
    key: [accountKey, startDateKey, endDateKey],
    indexes: [
      {
        name: EntityIndexerStateDALIndex.RequestState,
        key: [requestKey, stateKey],
      },
      {
        name: EntityIndexerStateDALIndex.AccountState,
        key: [accountKey, stateKey],
      },
    ],
  })
}
