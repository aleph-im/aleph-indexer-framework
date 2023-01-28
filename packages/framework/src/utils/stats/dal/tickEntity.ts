import { EntityStorage } from '@aleph-indexer/core'

export type TickEntity<T> = {
  account: string
  type: string
  date: number
  data: T
}

export type TickStatsStorage = EntityStorage<TickEntity<any>>

const accountKey = {
  get: (e: TickEntity<unknown>) => e.account,
  length: EntityStorage.AddressLength,
}

const typeKey = {
  get: (e: TickEntity<unknown>) => e.type,
  length: EntityStorage.VariableLength,
}

const dateKey = {
  get: (e: TickEntity<unknown>) => e.date,
  length: EntityStorage.TimestampLength,
}

export function createStatsTimeSeriesDAL(path: string): TickStatsStorage {
  return new EntityStorage<TickEntity<any>>({
    name: 'stats_time_series',
    path,
    key: [accountKey, typeKey, dateKey],
  })
}
