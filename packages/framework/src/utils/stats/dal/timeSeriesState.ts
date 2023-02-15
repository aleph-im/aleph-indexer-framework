import { EntityStorage } from '@aleph-indexer/core'
import { TimeFrame } from '../../time.js'

export enum TimeSeriesStateCode {
  Processing = 0,
  Processed = 1,
}

export type TimeSeriesState = {
  account: string
  type: string
  timeFrame: TimeFrame
  startDate: number
  endDate: number
  state: TimeSeriesStateCode
}

/**
 * Stats Entity Storage.
 */
export type TimeSeriesStateStorage = EntityStorage<TimeSeriesState>

export enum TimeSeriesStateDALIndex {
  AccountTypeState = 'account_type_state',
}

const accountKey = {
  get: (e: TimeSeriesState) => e.account,
  length: EntityStorage.AddressLength,
}

const typeKey = {
  get: (e: TimeSeriesState) => e.type,
  length: EntityStorage.VariableLength,
}

const timeFrameKey = {
  get: (e: TimeSeriesState) => e.timeFrame,
  length: 2,
}

// @note: start date in millis of the interval
const startDateKey = {
  get: (e: TimeSeriesState) => e.startDate,
  length: EntityStorage.TimestampLength,
}

const stateKey = {
  get: (e: TimeSeriesState) => e.state || TimeSeriesStateCode.Processing,
  length: 1,
}

/**
 * Creates a stats Entity Storage.
 */
export function createTimeSeriesStateDAL(path: string): TimeSeriesStateStorage {
  return new EntityStorage<TimeSeriesState>({
    name: 'time_frame_state',
    path,
    key: [accountKey, typeKey, timeFrameKey, startDateKey],
    indexes: [
      {
        name: TimeSeriesStateDALIndex.AccountTypeState,
        key: [accountKey, typeKey, stateKey],
      },
    ],
  })
}
