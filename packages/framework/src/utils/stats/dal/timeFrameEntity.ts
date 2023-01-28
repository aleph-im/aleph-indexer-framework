import { EntityStorage } from '@aleph-indexer/core'
import { TimeFrame } from '../../time.js'

export type TimeFrameEntity<T> = {
  account: string
  type: string
  timeFrame: TimeFrame
  startDate: number
  endDate: number
  data: T
}

/**
 * Stats Time Series Entity Storage.
 */
export type TimeFrameStatsStorage = EntityStorage<TimeFrameEntity<any>>

const accountKey = {
  get: (e: TimeFrameEntity<unknown>) => e.account,
  length: EntityStorage.AddressLength,
}

const typeKey = {
  get: (e: TimeFrameEntity<unknown>) => e.type,
  length: EntityStorage.VariableLength,
}

const timeFrameKey = {
  get: (e: TimeFrameEntity<unknown>) => e.timeFrame,
  length: 3,
}

// @note: start date in millis of the interval
const startDateKey = {
  get: (e: TimeFrameEntity<unknown>) => e.startDate,
  length: EntityStorage.TimestampLength,
}

/**
 * Creates a stats time series Entity Storage.
 */
export function createStatsTimeSeriesDAL(path: string): TimeFrameStatsStorage {
  return new EntityStorage<TimeFrameEntity<any>>({
    name: 'stats_time_series',
    path,
    key: [accountKey, typeKey, timeFrameKey, startDateKey],
  })
}
