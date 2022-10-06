export * from './utils/layouts/index.js'

import { AccountStats } from '@aleph-indexer/framework'
import {
  AccountType,
  ParsedEvents,
  ParsedAccountsData,
} from './utils/layouts/index.js'

export type MarinadeFinanceAccountInfo = {
  name: string
  programId: string
  address: string
  type: AccountType
  data: ParsedAccountsData
}

// -------------------------- STATS --------------------------

export type AccountTimeStat = {
  requests: number
  uniqueProgramIds: number
  interval: string
}

// You should group different related instructions to process their information together
export type MarinadeFinanceInfo = EventType1Info & EventType2Info

export type EventType1Info = {
  customProperties1: number
}

export type EventType2Info = {
  customProperties2: number
}

export type MarinadeFinanceStats = {
  requestsStatsByHour: Record<string, AccountTimeStat>
  last1h: MarinadeFinanceInfo
  last24h: MarinadeFinanceInfo
  last7d: MarinadeFinanceInfo
  total: MarinadeFinanceInfo
  accessingPrograms: Set<string>
  lastRequest?: ParsedEvents
}

export type HourlyStats = {
  stats: AccountTimeStat[]
  statsMap: Record<string, AccountTimeStat>
}

export type GlobalMarinadeFinanceStats = {
  totalAccounts: Record<AccountType, number>
  totalRequests: number
  totalUniqueAccessingPrograms: number
}

export type MarinadeFinanceProgramData = {
  info: MarinadeFinanceAccountInfo
  stats?: MarinadeFinanceStats
}

export type AccountTypesGlobalStats = {
  type: AccountType
  stats: AccountStats<GlobalMarinadeFinanceStats>
}
