import {
  AccountType,
  ParsedEvents,
  ParsedAccountsData,
} from './utils/layouts/index.js'

export type AlephDataSetContent = {
  name:              string;
  owner:             string;
  desc:              string;
  available:         boolean;
  ownsAllTimeseries: boolean;
  timeseriesIDs:     string[];
  views:             string[];
}

export type BrickAccountInfo = {
  name: string
  programId: string
  address: string
  type: AccountType
  data: ParsedAccountsData
}

// -------------------------- STATS --------------------------

export type AccessTimeStats = {
  /**
   * Total number of times the account was accessed
   */
  accesses: number
  /**
   * Number of times accessed, grouped by program ID
   */
  accessesByProgramId: {
    [programId: string]: number
  }
  /**
   * First access time in milliseconds digested in the stats
   */
  startTimestamp?: number
  /**
   * Last access time in milliseconds digested in the stats
   */
  endTimestamp?: number
}

export type TimeStats = AccessTimeStats //@note: Add more types of time stats here

export type BrickAccountStats = {
  requestsStatsByHour: Record<string, AccessTimeStats>
  last1h: AccessTimeStats
  last24h: AccessTimeStats
  last7d: AccessTimeStats
  total: AccessTimeStats
  accessingPrograms: Set<string>
  lastRequest?: ParsedEvents
}

export type HourlyStats = {
  stats: AccessTimeStats[]
  statsMap: Record<string, AccessTimeStats>
}

export type GlobalBrickStats = {
  totalAccounts: Record<AccountType, number>
  totalAccesses: number
  totalAccessesByProgramId: {
    [programId: string]: number
  }
  startTimestamp?: number
  endTimestamp?: number
}

export type BrickAccountData = {
  info: BrickAccountInfo
  stats?: BrickAccountStats
}
