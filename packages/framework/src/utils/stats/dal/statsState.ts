import { EntityStorage } from '@aleph-indexer/core'
import { TimeFrame } from '../../time.js'

export enum StatsStateState {
  Processing = 0,
  Processed = 1,
}

export type StatsState = {
  account: string
  type: string
  timeFrame: TimeFrame
  startDate: number
  endDate: number
  state: StatsStateState
}

/**
 * Stats Entity Storage.
 */
export type StatsStateStorage = EntityStorage<StatsState>

export enum StatsStateDALIndex {
  AccountTypeState = 'account_type_state',
}

const accountKey = {
  get: (e: StatsState) => e.account,
  length: EntityStorage.AddressLength,
}

const typeKey = {
  get: (e: StatsState) => e.type,
  length: EntityStorage.VariableLength,
}

const timeFrameKey = {
  get: (e: StatsState) => e.timeFrame,
  length: 2,
}

// @note: start date in millis of the interval
const startDateKey = {
  get: (e: StatsState) => e.startDate,
  length: EntityStorage.TimestampLength,
}

const stateKey = {
  get: (e: StatsState) => e.state || StatsStateState.Processing,
  length: 1,
}

/**
 * Creates a stats Entity Storage.
 */
export function createStatsStateDAL(path: string): StatsStateStorage {
  return new EntityStorage<StatsState>({
    name: 'stats_state',
    path,
    key: [accountKey, typeKey, timeFrameKey, startDateKey],
    indexes: [
      {
        name: StatsStateDALIndex.AccountTypeState,
        key: [accountKey, typeKey, stateKey],
      },
    ],
  })
}
