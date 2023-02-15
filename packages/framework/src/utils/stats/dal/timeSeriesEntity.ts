import { EntityStorage } from '@aleph-indexer/core'
import { TimeFrame } from '../../time.js'

export type TimeSeriesEntity<T> = {
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
export type TimeSeriesStatsStorage = EntityStorage<TimeSeriesEntity<any>>

const accountKey = {
  get: (e: TimeSeriesEntity<unknown>) => e.account,
  length: EntityStorage.AddressLength,
}

const typeKey = {
  get: (e: TimeSeriesEntity<unknown>) => e.type,
  length: EntityStorage.VariableLength,
}

const timeFrameKey = {
  get: (e: TimeSeriesEntity<unknown>) => e.timeFrame,
  length: 3,
}

// @note: start date in millis of the interval
const startDateKey = {
  get: (e: TimeSeriesEntity<unknown>) => e.startDate,
  length: EntityStorage.TimestampLength,
}

/**
 * Creates a stats time series Entity Storage.
 */
export function createStatsTimeSeriesDAL(path: string): TimeSeriesStatsStorage {
  return new EntityStorage<TimeSeriesEntity<any>>({
    name: 'stats_time_series',
    path,
    key: [accountKey, typeKey, timeFrameKey, startDateKey],
  })
}
