import { DateTime } from 'luxon'
import { TimeFrame, AccountAggregatorFnArgs } from '@aleph-indexer/framework'
import { MarinadeFinanceStats, MarinadeFinanceInfo } from '../../types.js'
import eventAggregator from './timeSeriesAggregator.js'

export class StatsAggregator {
  async aggregate(
    args: AccountAggregatorFnArgs,
  ): Promise<MarinadeFinanceStats> {
    const { now, account, timeSeriesDAL } = args

    const stats = this.getEmptyStats()

    const type = 'marinade_finance'
    const currHour = DateTime.fromMillis(now).startOf('hour')
    const commonFields = [account, type, TimeFrame.Hour]

    const last1h = await timeSeriesDAL.get([
      ...commonFields,
      currHour.toMillis(),
    ])

    const last24hEvents = await timeSeriesDAL.getAllValuesFromTo(
      [...commonFields, currHour.minus({ hours: 24 }).toMillis()],
      [...commonFields, currHour.toMillis()],
    )

    let last24h
    for await (const event of last24hEvents) {
      last24h = eventAggregator.aggregate(event.data, last24h)
    }

    const last7dEvents = await timeSeriesDAL.getAllValuesFromTo(
      [...commonFields, currHour.minus({ hours: 24 * 7 }).toMillis()],
      [...commonFields, currHour.toMillis()],
    )

    let last7d
    for await (const event of last7dEvents) {
      last7d = eventAggregator.aggregate(event.data, last7d)
    }

    const total = await timeSeriesDAL.get([account, type, TimeFrame.All, 0])

    if (last1h) stats.last1h = last1h.data
    if (last24h) stats.last24h = last24h
    if (last7d) stats.last7d = last7d
    if (total) stats.total = total.data

    return stats
  }

  protected getEmptyStats(): MarinadeFinanceStats {
    return {
      requestsStatsByHour: {},
      last1h: this.getEmptyMarinadeFinanceStats(),
      last24h: this.getEmptyMarinadeFinanceStats(),
      last7d: this.getEmptyMarinadeFinanceStats(),
      total: this.getEmptyMarinadeFinanceStats(),
      accessingPrograms: new Set<string>(),
    }
  }
  protected getEmptyMarinadeFinanceStats(): MarinadeFinanceInfo {
    return {
      customProperties1: 0,

      customProperties2: 0,
    }
  }
}

export const statsAggregator = new StatsAggregator()
export default statsAggregator
