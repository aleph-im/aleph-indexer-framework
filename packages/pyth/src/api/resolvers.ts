import {
  Candle,
  CandleInterval,
  GlobalPythStats,
  Price,
  PythAccountData,
  PythAccountInfo,
} from '../types.js'
import MainDomain from '../domain/main.js'

export type PricesFilters = {
  address: string
  startDate?: number
  endDate?: number
  limit?: number
  skip?: number
  reverse?: boolean
}

export type PriceFilters = {
  address: string
  timestamp: number
}

export type AccountsFilters = {
  accounts?: string[]
  includeStats?: boolean
}

export type CandlesFilters = PricesFilters & { candleInterval: CandleInterval }

export class APIResolver {
  constructor(protected domain: MainDomain) {}

  async getAccounts(args: AccountsFilters): Promise<PythAccountInfo[]> {
    const acountsData = await this.filterAccounts(args)
    return acountsData.map(({ info, stats }) => ({ ...info, stats }))
  }

  protected async filterAccounts({
    accounts,
    includeStats,
  }: AccountsFilters): Promise<PythAccountData[]> {
    const accountMap = await this.domain.getAccounts(includeStats)

    accounts =
      accounts ||
      Object.values(accountMap).map((account) => account.info.address)

    const accountsData = accounts
      .map((address) => accountMap[address])
      .filter((account) => !!account)

    return accountsData
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

  async getPriceByTimestamp({
    address,
    timestamp,
  }: PriceFilters): Promise<Price> {
    return await this.domain.getPriceByTimestamp(address, timestamp)
  }

  async getGlobalStats(): Promise<GlobalPythStats> {
    return this.domain.getGlobalStats()
  }
}
