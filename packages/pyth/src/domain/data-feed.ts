import {
  AccountStats,
  AccountStatsFilters,
  AccountTimeSeriesStats,
  AccountTimeSeriesStatsManager,
} from '@aleph-indexer/framework'
import { PriceDALIndex, PriceStorage } from '../dal/price.js'
import { DataFeedInfo, Price } from '../types.js'
import { StorageStream } from '@aleph-indexer/core'

export class DataFeed {
  constructor(
    public info: DataFeedInfo,
    protected priceDAL: PriceStorage,
    protected timeSeriesStats: AccountTimeSeriesStatsManager,
  ) {}

  async updateStats(now: number): Promise<void> {
    await this.timeSeriesStats.process(now)
  }

  getTimeSeriesStats(
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats> {
    return this.timeSeriesStats.getTimeSeriesStats(type, filters)
  }

  async getStats(): Promise<AccountStats> {
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
