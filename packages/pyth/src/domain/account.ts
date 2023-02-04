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
}
