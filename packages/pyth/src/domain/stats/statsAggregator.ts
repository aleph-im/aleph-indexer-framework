import { DateTime, Duration } from 'luxon'
import {
  AccountAggregatorFnArgs,
  MAX_TIMEFRAME,
} from '@aleph-indexer/framework'
import { PythAccountStats } from '../../types.js'
import pythCandleAggregator from './candleAggregator.js'

export class StatsAggregator {
  async aggregate(args: AccountAggregatorFnArgs): Promise<PythAccountStats> {
    const { now, account, timeSeriesDAL } = args

    const stats = this.getEmptyStats()
    const type = 'candle'
    const currHour = DateTime.fromMillis(now).startOf('hour')
    const currDay = DateTime.fromMillis(now).startOf('day')
    const currMonth = DateTime.fromMillis(now).startOf('month')
    const currYear = DateTime.fromMillis(now).startOf('year')
    const hourTimeFrame = Duration.fromObject({ hours: 1 }).toMillis()
    const dayTimeFrame = Duration.fromObject({ days: 1 }).toMillis()
    const monthTimeFrame = Duration.fromObject({ months: 1 }).toMillis()
    const commonFields = [account, type]

    // @note: this will be the only candle that is 100% accurate
    const currHourStats = await timeSeriesDAL.get([
      ...commonFields,
      hourTimeFrame,
      currHour.toMillis(),
    ])

    // @note: other candles' open timestamp is at most a full hour
    const last24hHourlyCandles = await timeSeriesDAL.getAllValuesFromTo(
      [
        ...commonFields,
        hourTimeFrame,
        currHour.minus({ hours: 24 }).toMillis(),
      ],
      [...commonFields, hourTimeFrame, currHour.toMillis()],
    )

    let last24h
    for await (const event of last24hHourlyCandles) {
      last24h = pythCandleAggregator.aggregate(event.data, last24h)
    }

    const last7dHourlyCandles = await timeSeriesDAL.getAllValuesFromTo(
      [...commonFields, hourTimeFrame, currHour.minus({ days: 7 }).toMillis()],
      // @note: we need to subtract 1 hour here to not count the hour 24h ago twice
      [
        ...commonFields,
        hourTimeFrame,
        currHour.minus({ hours: 25 }).toMillis(),
      ],
    )

    let last7d
    for await (const event of last7dHourlyCandles) {
      last7d = pythCandleAggregator.aggregate(event.data, last7d)
    }
    // @note: this saves us aggregating the last 24 hours again
    if (last24h) {
      last7d = pythCandleAggregator.aggregate(last24h, last7d)
    }

    // @note: We will fetch daily candles for the last month and hourly candles for the first day of the month
    const lastMonthDailyCandles = await timeSeriesDAL.getAllValuesFromTo(
      [
        ...commonFields,
        dayTimeFrame,
        currDay.minus({ month: 1 }).plus({ day: 1 }).toMillis(),
      ],
      [...commonFields, dayTimeFrame, currDay.toMillis()],
    )
    const beforeLastMonthHourlyCandles = await timeSeriesDAL.getAllValuesFromTo(
      [...commonFields, hourTimeFrame, currHour.minus({ month: 1 }).toMillis()],
      [
        ...commonFields,
        hourTimeFrame,
        currHour.minus({ month: 1 }).plus({ hours: 23 }).toMillis(),
      ],
    )

    let lastMonth
    for await (const event of beforeLastMonthHourlyCandles) {
      lastMonth = pythCandleAggregator.aggregate(event.data, lastMonth)
    }
    for await (const event of lastMonthDailyCandles) {
      lastMonth = pythCandleAggregator.aggregate(event.data, lastMonth)
    }

    // @note: simple fetch for YTD
    const YTD = await timeSeriesDAL.get([
      account,
      type,
      Duration.fromDurationLike({ years: 1 }).toMillis(),
      currYear.toMillis(),
    ])

    const lastYearMonthlyCandles = await timeSeriesDAL.getAllValuesFromTo(
      [
        ...commonFields,
        monthTimeFrame,
        currMonth.minus({ years: 1 }).plus({ month: 1 }).toMillis(),
      ],
      [...commonFields, monthTimeFrame, currYear.toMillis()],
    )
    const beforeLastYearDailyCandles = await timeSeriesDAL.getAllValuesFromTo(
      [
        ...commonFields,
        dayTimeFrame,
        currDay.minus({ years: 1 }).plus({ day: 1 }).toMillis(),
      ],
      [
        ...commonFields,
        dayTimeFrame,
        currDay
          .minus({ years: 1 })
          .plus({ month: 1 })
          .minus({ day: 1 })
          .toMillis(),
      ],
    )
    const beforeLastYearHourlyCandles = await timeSeriesDAL.getAllValuesFromTo(
      [...commonFields, hourTimeFrame, currHour.minus({ years: 1 }).toMillis()],
      [
        ...commonFields,
        hourTimeFrame,
        currHour.minus({ years: 1 }).plus({ hours: 23 }).toMillis(),
      ],
    )

    let lastYear
    for await (const event of beforeLastYearHourlyCandles) {
      lastYear = pythCandleAggregator.aggregate(event.data, lastYear)
    }
    for await (const event of beforeLastYearDailyCandles) {
      lastYear = pythCandleAggregator.aggregate(event.data, lastYear)
    }
    for await (const event of lastYearMonthlyCandles) {
      lastYear = pythCandleAggregator.aggregate(event.data, lastYear)
    }
    if (YTD) {
      lastYear = pythCandleAggregator.aggregate(YTD.data, lastYear)
    }

    const total = await timeSeriesDAL.get([
      account,
      type,
      MAX_TIMEFRAME.toMillis(),
      0,
    ])

    if (currHourStats) {
      stats.last1h = currHourStats.data
      stats.markPrice = currHourStats.data.closePrice
      stats.confidence = currHourStats.data.closeConfidence
    }
    if (last24h) stats.last24h = last24h
    if (last7d) stats.last7d = last7d
    if (lastMonth) stats.lastMonth = lastMonth
    if (YTD) stats.YTD = YTD.data
    if (lastYear) stats.lastYear = lastYear
    if (total) stats.total = total.data

    return stats
  }

  protected getEmptyStats(): PythAccountStats {
    return {
      last1h: pythCandleAggregator.getEmptyCandle(),
      last24h: pythCandleAggregator.getEmptyCandle(),
      last7d: pythCandleAggregator.getEmptyCandle(),
      lastMonth: pythCandleAggregator.getEmptyCandle(),
      YTD: pythCandleAggregator.getEmptyCandle(),
      lastYear: pythCandleAggregator.getEmptyCandle(),
      total: pythCandleAggregator.getEmptyCandle(),
      confidence: 0,
      markPrice: 0,
    }
  }
}

export const statsAggregator = new StatsAggregator()
export default statsAggregator
