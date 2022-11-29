import { EntityStorage } from '@aleph-indexer/core'
import {IntervalEntity} from "../types";

export type StatsTimeSeries<T> = IntervalEntity & {
  account: string
  type: string
  timeFrame: number
  data: T
}

/**
 * Stats Time Series Entity Storage.
 */
export type StatsTimeSeriesStorage = EntityStorage<StatsTimeSeries<any>>

const accountKey = {
  get: (e: StatsTimeSeries<unknown>) => e.account,
  length: EntityStorage.AddressLength,
}

const typeKey = {
  get: (e: StatsTimeSeries<unknown>) => e.type,
  length: EntityStorage.VariableLength,
}

const timeFrameKey = {
  get: (e: StatsTimeSeries<unknown>) => e.timeFrame,
  length: 3,
}

// @note: start date in millis of the interval
const startDateKey = {
  get: (e: StatsTimeSeries<unknown>) => e.startTimestamp,
  length: EntityStorage.TimestampLength,
}

/**
 * Creates a stats time series Entity Storage.
 */
export function createStatsTimeSeriesDAL(path: string): StatsTimeSeriesStorage {
  return new EntityStorage<StatsTimeSeries<any>>({
    name: 'stats_time_series',
    path,
    key: [accountKey, typeKey, timeFrameKey, startDateKey],
  })
}
