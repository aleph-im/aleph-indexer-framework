import { EntityStorage } from '@aleph-indexer/core'
import { IndexableEntityType } from '../../../../types.js'

export enum EntityIndexerStateCode {
  Pending = 0,
  Ready = 1,
  Processed = 2,
}

/**
 * Describes an indexer state date range associated with an account.
 * @property {string} account Account to index.
 * @property {number} startDate Start date of the range.
 * @property {number} endDate End date of the range.
 * @property {EntityIndexerStateCode} state State of the indexer.
 * @property {number} requestNonce Request nonce of the indexer request
 */
export type EntityIndexerState = {
  account: string
  startDate: number
  endDate: number
  page?: number
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
  Request = 'request',
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

const pageKey = {
  get: (e: EntityIndexerState) => e.page,
  length: 5, // @note: 5 digits should be enough for 10 mil transactions per hour
}

export function createEntityIndexerStateDAL(
  path: string,
  type: IndexableEntityType,
): EntityIndexerStateStorage {
  return new EntityStorage<EntityIndexerState>({
    name: `${type}_indexer_state`,
    path,
    key: [accountKey, startDateKey, endDateKey, pageKey],
    indexes: [
      {
        name: EntityIndexerStateDALIndex.Request,
        key: [requestKey],
      },
      {
        name: EntityIndexerStateDALIndex.AccountState,
        key: [accountKey, stateKey],
      },
    ],
  })
}
