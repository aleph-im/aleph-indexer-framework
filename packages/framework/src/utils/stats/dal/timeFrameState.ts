import { EntityStorage } from '@aleph-indexer/core'
import { TimeFrame } from '../../time.js'

export enum TimeFrameStateCode {
  Processing = 0,
  Processed = 1,
}

export type TimeFrameState = {
  account: string
  type: string
  timeFrame: TimeFrame
  startDate: number
  endDate: number
  state: TimeFrameStateCode
}

/**
 * Stats Entity Storage.
 */
export type TimeFrameStateStorage = EntityStorage<TimeFrameState>

export enum TimeFrameStateDALIndex {
  AccountTypeState = 'account_type_state',
}

const accountKey = {
  get: (e: TimeFrameState) => e.account,
  length: EntityStorage.AddressLength,
}

const typeKey = {
  get: (e: TimeFrameState) => e.type,
  length: EntityStorage.VariableLength,
}

const timeFrameKey = {
  get: (e: TimeFrameState) => e.timeFrame,
  length: 2,
}

// @note: start date in millis of the interval
const startDateKey = {
  get: (e: TimeFrameState) => e.startDate,
  length: EntityStorage.TimestampLength,
}

const stateKey = {
  get: (e: TimeFrameState) => e.state || TimeFrameStateCode.Processing,
  length: 1,
}

/**
 * Creates a stats Entity Storage.
 */
export function createTimeFrameStateDAL(path: string): TimeFrameStateStorage {
  return new EntityStorage<TimeFrameState>({
    name: 'time_frame_state',
    path,
    key: [accountKey, typeKey, timeFrameKey, startDateKey],
    indexes: [
      {
        name: TimeFrameStateDALIndex.AccountTypeState,
        key: [accountKey, typeKey, stateKey],
      },
    ],
  })
}
