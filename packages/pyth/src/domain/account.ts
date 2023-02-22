import {
  AccountStats,
  AccountStatsFilters,
  AccountTimeSeriesStats,
  AccountTimeSeriesStatsManager,
} from '@aleph-indexer/framework'
import { PriceDALIndex, PriceStorage } from '../dal/price.js'
import { PythAccountInfo, PythAccountStats, Price, Candle } from '../types.js'
import { StorageStream } from '@aleph-indexer/core'

export class AccountDomain {
  constructor(
    public info: PythAccountInfo,
    protected priceDAL: PriceStorage,
    protected timeSeriesStats: AccountTimeSeriesStatsManager<PythAccountStats>,
  ) {}

  async updateStats(now: number): Promise<void> {
    await this.timeSeriesStats.process(now)
  }

  async getTimeSeriesStats(
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats<Candle>> {
    return this.timeSeriesStats.getTimeSeriesStats(type, filters)
  }

  async getStats(): Promise<AccountStats<PythAccountStats>> {
    return this.timeSeriesStats.getStats()
  }

  async getHistoricalPrices(
    startDate: number,
    endDate: number,
    opts: any,
  ): Promise<StorageStream<string, Price>> {
    return await this.priceDAL
      .useIndex(PriceDALIndex.AccountTimestamp)
      .getAllFromTo(
        [this.info.address, startDate],
        [this.info.address, endDate],
        opts,
      )
  }

  async getPriceByTimestamp(
    timestamp: number
  ): Promise<Price> {
    const price = await this.priceDAL
      .useIndex(PriceDALIndex.AccountTimestamp)
      .getLastValueFromTo(
        [this.info.address, 0],
        [this.info.address, timestamp],
      )
    if (price) return price
    return {
      id: '',
      timestamp: 0,
      pubSlot: 0,
      priceAccount: this.info.address,
      price: 0,
      confidence: 0,
      status: 0,
    }
  }
}
