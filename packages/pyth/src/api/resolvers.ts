import {
  Candle,
  CandleInterval,
  DataFeedData,
  DataFeedStatsWithAddress,
  GlobalPythStats,
  Price,
} from '../types'
import MainDomain from '../domain/main.js'

export type PricesFilters = {
  address: string
  startDate?: number
  endDate?: number
  limit?: number
  skip?: number
  reverse?: boolean
}

export type CandlesFilters = PricesFilters & { candleInterval: CandleInterval }

export class APIResolver {
  constructor(protected domain: MainDomain) {}

  async getDataFeeds(): Promise<DataFeedData[]> {
    const result = await this.domain.getDataFeeds(false)
    return Object.values(result)
  }

  async getDataFeedStats(): Promise<DataFeedStatsWithAddress[]> {
    const result = await this.domain.getDataFeeds(true)
    return Object.entries(result).map(([k, v]) => {
      return {
        address: k,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ...v.stats!,
      }
    })
  }

  async getPrices({
    address,
    startDate = 0,
    endDate = Date.now(),
    limit = 1000,
    skip = 0,
    reverse = true,
  }: PricesFilters): Promise<Price[]> {
    if (limit < 1 || limit > 1000)
      throw new Error('400 Bad Request: 1 <= limit <= 1000')

    const result: Price[] = []

    const prices = await this.domain.getHistoricalPrices(
      address,
      startDate,
      endDate,
      {
        reverse,
        limit: limit + skip,
      },
    )
    for await (const { value } of prices) {
      // @note: Skip first N events
      if (--skip >= 0) continue

      result.push(value)

      // @note: Stop when after reaching the limit
      if (limit > 0 && result.length >= limit) return result
    }

    return result
  }

  async getCandles({
    address,
    candleInterval,
    startDate = 0,
    endDate = Date.now(),
    limit = 1000,
    skip = 0,
    reverse = true,
  }: CandlesFilters): Promise<Candle[]> {
    if (limit < 1 || limit > 1000)
      throw new Error('400 Bad Request: 1 <= limit <= 1000')

    const result: Candle[] = []

    const { series } = await this.domain.getCandles(
      address,
      candleInterval,
      startDate,
      endDate,
      {
        reverse,
        limit: limit + skip,
      },
    )
    for await (const { value } of series) {
      // @note: Skip first N events
      if (--skip >= 0) continue

      result.push(value)

      // @note: Stop when after reaching the limit
      if (limit > 0 && result.length >= limit) return result
    }

    return result
  }

  async getGlobalStats(): Promise<GlobalPythStats> {
    return this.domain.getGlobalStats()
  }
}
