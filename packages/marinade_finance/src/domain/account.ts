import { StorageStream } from '@aleph-indexer/core'
import {
  AccountTimeSeriesStatsManager,
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats,
} from '@aleph-indexer/framework'
import { EventDALIndex, EventStorage } from '../dal/event.js'
import { ParsedEvents } from '../utils/layouts/index.js'
import { MarinadeFinanceAccountInfo, TimeStats } from '../types.js'

export class AccountDomain {
  constructor(
    public info: MarinadeFinanceAccountInfo,
    protected eventDAL: EventStorage,
    protected timeSeriesStats: AccountTimeSeriesStatsManager,
  ) {}

  async updateStats(now: number): Promise<void> {
    await this.timeSeriesStats.process(now)
  }

  async getTimeSeriesStats(
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats> {
    return this.timeSeriesStats.getTimeSeriesStats(type, filters)
  }

  async getStats(): Promise<AccountStats<TimeStats>> {
    return this.timeSeriesStats.getStats()
  }

  getEventsByTime(
    startDate: number,
    endDate: number,
    opts: any,
  ): Promise<StorageStream<string, ParsedEvents>> {
    return this.eventDAL
      .useIndex(EventDALIndex.AccoountTimestamp)
      .getAllFromTo(
        [this.info.address, startDate],
        [this.info.address, endDate],
        opts,
      )
  }
}
