import { DateTime } from 'luxon'
import { TimeFrame, AccountAggregatorFnArgs } from '@aleph-indexer/framework'
import { BrickAccountStats } from '../../types.js'
import accessAggregator from './timeSeriesAggregator.js'

export class StatsAggregator {
  async aggregate(args: AccountAggregatorFnArgs): Promise<BrickAccountStats> {
    const { now, account, timeSeriesDAL } = args

    const stats = this.getEmptyStats()
    const type = 'access'
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
      last24h = accessAggregator.aggregate(event.data, last24h)
    }

    const last7dEvents = await timeSeriesDAL.getAllValuesFromTo(
      [...commonFields, currHour.minus({ hours: 24 * 7 }).toMillis()],
      [...commonFields, currHour.toMillis()],
    )

    let last7d
    for await (const event of last7dEvents) {
      last7d = accessAggregator.aggregate(event.data, last7d)
    }
    const total = await timeSeriesDAL.get([account, type, TimeFrame.All, 0])

    if (last1h) stats.last1h = last1h.data
    if (last24h) stats.last24h = last24h
    if (last7d) stats.last7d = last7d
    if (total) stats.total = total.data

    stats.accessingPrograms = new Set<string>([
      ...(Object.keys(stats.total?.accessesByProgramId) || []),
    ])

    return stats
  }

  protected getEmptyStats(): BrickAccountStats {
    return {
      requestsStatsByHour: {},
      last1h: accessAggregator.getEmptyAccessTimeStats(),
      last24h: accessAggregator.getEmptyAccessTimeStats(),
      last7d: accessAggregator.getEmptyAccessTimeStats(),
      total: accessAggregator.getEmptyAccessTimeStats(),
      accessingPrograms: new Set<string>(),
    }
  }
}

export const statsAggregator = new StatsAggregator()
export default statsAggregator
