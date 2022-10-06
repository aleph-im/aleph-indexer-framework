import BN from 'bn.js'
import { EntityStorage } from '@aleph-indexer/core'
import { ParsedEvents } from '../types.js'

export type EventStorage = EntityStorage<ParsedEvents>

// in this vector you can include the properties of several
// events that are BN in order to be able to cast them
const mappedProps = ['none']

export enum EventDALIndex {
  AccoountTimestamp = 'timestamp',
  AccounTypeTimestamp = 'account_timestamp',
}

const idKey = {
  get: (e: ParsedEvents) => e.id,
  length: EntityStorage.VariableLength,
}

const accountKey = {
  get: (e: ParsedEvents) => e.account,
  length: EntityStorage.AddressLength,
}

const typeKey = {
  get: (e: ParsedEvents) => e.type,
  length: EntityStorage.VariableLength,
}

const timestampKey = {
  get: (e: ParsedEvents) => e.timestamp,
  length: EntityStorage.TimestampLength,
}

export function createEventDAL(path: string): EventStorage {
  return new EntityStorage<ParsedEvents>({
    name: 'event',
    path,
    key: [idKey],
    indexes: [
      {
        name: EventDALIndex.AccoountTimestamp,
        key: [accountKey, timestampKey],
      },
      {
        name: EventDALIndex.AccounTypeTimestamp,
        key: [accountKey, typeKey, timestampKey],
      },
    ],
    mapFn: async function (entry) {
      const { key, value } = entry

      // @note: Stored as hex strings (bn.js "toJSON" method), so we need to cast them to BN always
      for (const prop of mappedProps) {
        if (!(prop in value)) continue
        if ((value as any)[prop] instanceof BN) continue
        ;(value as any)[prop] = new BN((value as any)[prop], 'hex')
      }

      return { key, value }
    },
  })
}
