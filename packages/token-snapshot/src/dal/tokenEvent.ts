import { EntityStorage } from '@aleph-indexer/core'
import { SPLTokenEvent } from '../types.js'
import { getBigNumberMapFn } from './common.js'

const mappedProps = ['balance']

export type SPLTokenEventStorage = EntityStorage<SPLTokenEvent>

export enum SPLTokenEventDALIndex {
  AccountTimestamp = 'account_timestamp',
  AccountTypeTimestamp = 'account_type_timestamp',
}

const idKey = {
  get: (e: SPLTokenEvent) => e.id,
  length: EntityStorage.VariableLength,
}

const accountKey = {
  get: (e: SPLTokenEvent) => e.account,
  length: EntityStorage.AddressLength,
}

const typeKey = {
  get: (e: SPLTokenEvent) => e.type,
  length: EntityStorage.VariableLength,
}

const timestampKey = {
  get: (e: SPLTokenEvent) => e.timestamp,
  length: EntityStorage.TimestampLength,
}

export function createSPLTokenEventDAL(path: string): SPLTokenEventStorage {
  return new EntityStorage<SPLTokenEvent>({
    name: 'token_event',
    path,
    key: [idKey],
    indexes: [
      {
        name: SPLTokenEventDALIndex.AccountTimestamp,
        key: [accountKey, timestampKey],
      },
      {
        name: SPLTokenEventDALIndex.AccountTypeTimestamp,
        key: [accountKey, typeKey, timestampKey],
      },
    ],
    mapFn: getBigNumberMapFn(mappedProps),
  })
}
