import { EntityStorage } from '@aleph-indexer/core'
import { Price } from '../types.js'

export type PriceStorage = EntityStorage<Price>

export enum PriceDALIndex {
  AccountTimestamp = 'account_timestamp',
}

const idKey = {
  get: (e: Price) => e.id,
  length: EntityStorage.VariableLength,
}

const timestampKey = {
  get: (e: Price) => e.timestamp.toString(),
  length: EntityStorage.TimestampLength,
}

const accountKey = {
  get: (e: Price) => e.priceAccount,
  length: EntityStorage.AddressLength,
}

export function createPriceDAL(dbPath: string): PriceStorage {
  return new EntityStorage<Price>({
    name: 'price',
    path: dbPath,
    key: [idKey],
    indexes: [
      {
        name: PriceDALIndex.AccountTimestamp,
        key: [accountKey, timestampKey],
      },
    ],
  })
}
