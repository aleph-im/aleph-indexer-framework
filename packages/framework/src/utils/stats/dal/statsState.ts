import { EntityStorage } from '@aleph-indexer/core'

export enum StatsStateStatus {
  Processing = 0,
  Processed = 1,
}

/**
 * Storage record for the processing state of a stats entry.
 */
export type StatsState = {
  /**
   * Account address to which the stats belong.
   */
  account: string
  /**
   * User defined type of the stats.
   */
  type: string
  /**
   * Duration in millis.
   */
  timeFrame: number
  /**
   * Start date in millis.
   */
  startDate: number
  /**
   * End date in millis.
   */
  endDate: number
  /**
   * Processing state. 0 = processing, 1 = processed.
   */
  state: StatsStateStatus
}

/**
 * Stats Entity Storage.
 */
export type StatsStateStorage = EntityStorage<StatsState>

/**
 * Enum for the different indexes of the stats state storage.
 */
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
  get: (e: StatsState) => e.state || StatsStateStatus.Processing,
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
