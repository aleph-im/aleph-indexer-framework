import MainDomain from '../domain/main.js'

export type ReservesFilters = {
  lendingMarket: string
  reserves?: string[]
  includeStats?: boolean
}

export type EventsFilters = {
  reserve: string
  types?: string[]
  startDate?: number
  endDate?: number
  limit?: number
  skip?: number
  reverse?: boolean
}

export type GlobalStatsFilters = ReservesFilters

export class APIResolver {
  constructor(protected domain: MainDomain) {}
}
