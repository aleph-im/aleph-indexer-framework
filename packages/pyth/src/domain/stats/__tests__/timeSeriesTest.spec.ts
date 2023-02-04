import { jest } from '@jest/globals'
import { mockPriceDAL } from '../__mocks__/DAL.js'
import { mockAccountStats } from '../__mocks__/accountStats.js'
import { CandleInterval } from '../../../types.js' 

import { getTimeFrame } from '../../../constants.js'
// jest.useFakeTimers()
jest.setTimeout(100000)

describe('AccountTimeSeries', () => {
  it('getAccountStats with many recent events', async () => {
    const accountAddress = '3wDLxH34Yz8tGjwHszQ2MfzHwRoaQgKA32uq2bRpjJBW'
    const testName = 'AccountStatsManyRecentEvents'
    const eventDAL = await mockPriceDAL(testName)
    const accountStats = await mockAccountStats(
      eventDAL,
      accountAddress,
      testName,
    )

    await accountStats.init()
    await accountStats.process(Date.now())
    const stats = await accountStats.getStats()
    
    expect(stats.stats.markPrice).toBeDefined()
    expect(stats.stats.total.highPrice).toEqual(82.21000000000001)
  })

  it('checkAllCandlesIntervals', async () => {
    const accountAddress = '3wDLxH34Yz8tGjwHszQ2MfzHwRoaQgKA32uq2bRpjJBW'
    const testName = 'checkAllCandlesIntervals'
    const eventDAL = await mockPriceDAL(testName)
    const accountStats = await mockAccountStats(
      eventDAL,
      accountAddress,
      testName,
    )

    await accountStats.init()
    await accountStats.process(Date.now())

    const opts = {
      startDate: 0,
      endDate: Date.now(),
      reverse: true,
      limit: 1000,
    }

    let candleInterval: CandleInterval = "minute1"
    const minuteStats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(minuteStats.series.length).toBeGreaterThan(0)

    candleInterval = "minute5"
    const minute5Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(minute5Stats.series.length).toBeLessThanOrEqual(minuteStats.series.length)
    expect(minute5Stats.series.length).toBeGreaterThan(0)

    candleInterval = "minute10"
    const minute10Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(minute10Stats.series.length).toBeLessThanOrEqual(minute5Stats.series.length)
    expect(minute10Stats.series.length).toBeGreaterThan(0)

    candleInterval = "minute15"
    const minute15Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(minute15Stats.series.length).toBeLessThanOrEqual(minute10Stats.series.length)
    expect(minute15Stats.series.length).toBeGreaterThan(0)

    candleInterval = "minute30"
    const minute30Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(minute30Stats.series.length).toBeLessThanOrEqual(minute15Stats.series.length)
    expect(minute30Stats.series.length).toBeGreaterThan(0)

    candleInterval = "hour1"
    const hour1Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(hour1Stats.series.length).toBeLessThanOrEqual(minute30Stats.series.length)
    expect(hour1Stats.series.length).toBeGreaterThan(0)

    candleInterval = "hour2"
    const hour2Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(hour2Stats.series.length).toBeLessThanOrEqual(hour1Stats.series.length)
    expect(hour2Stats.series.length).toBeGreaterThan(0)

    candleInterval = "hour3"
    const hour3Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(hour3Stats.series.length).toBeLessThanOrEqual(hour2Stats.series.length)
    expect(hour3Stats.series.length).toBeGreaterThan(0)

    candleInterval = "hour4"
    const hour4Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(hour4Stats.series.length).toBeLessThanOrEqual(hour3Stats.series.length)
    expect(hour4Stats.series.length).toBeGreaterThan(0)

    candleInterval = "hour6"
    const hour6Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(hour6Stats.series.length).toBeLessThanOrEqual(hour4Stats.series.length)
    expect(hour6Stats.series.length).toBeGreaterThan(0)

    candleInterval = "hour8"
    const hour8Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(hour8Stats.series.length).toBeLessThanOrEqual(hour6Stats.series.length)
    expect(hour8Stats.series.length).toBeGreaterThan(0)

    candleInterval = "hour12"
    const hour12Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(hour12Stats.series.length).toBeLessThanOrEqual(hour8Stats.series.length)
    expect(hour12Stats.series.length).toBeGreaterThan(0)

    candleInterval = "day1"
    const day1Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(day1Stats.series.length).toBeLessThanOrEqual(hour12Stats.series.length)
    expect(day1Stats.series.length).toBeGreaterThan(0)

    candleInterval = "week1"
    const week1Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(week1Stats.series.length).toBeLessThanOrEqual(day1Stats.series.length)
    expect(week1Stats.series.length).toBeGreaterThan(0)

    candleInterval = "week2"
    const week2Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(week2Stats.series.length).toBeLessThanOrEqual(week1Stats.series.length)
    expect(week2Stats.series.length).toBeGreaterThan(0)

    candleInterval = "month1"
    const monthStats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(monthStats.series.length).toBeLessThanOrEqual(week2Stats.series.length)
    expect(monthStats.series.length).toBeGreaterThan(0)

    candleInterval = "month3"
    const month3Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(month3Stats.series.length).toBeLessThanOrEqual(monthStats.series.length)
    expect(month3Stats.series.length).toBeGreaterThan(0)

    candleInterval = "year1"
    const year1Stats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(year1Stats.series.length).toBeLessThanOrEqual(month3Stats.series.length)
    expect(year1Stats.series.length).toBeGreaterThan(0)

    candleInterval = "all"
    const allStats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })
    expect(allStats.series.length).toBeLessThanOrEqual(year1Stats.series.length)
    expect(allStats.series.length).toBeGreaterThan(0)
    expect(allStats.series[0].value.openTimestamp).toBe(1675175243000)
  })

  // assumes sorted events (by timestamp in the vector)
  it('checkCandleSeriesData', async () => {
    const accountAddress = '3wDLxH34Yz8tGjwHszQ2MfzHwRoaQgKA32uq2bRpjJBW'
    const testName = 'checkCandleSeriesData'
    const eventDAL = await mockPriceDAL(testName)
    const accountStats = await mockAccountStats(
      eventDAL,
      accountAddress,
      testName,
    )

    await accountStats.process(Date.now())

    const opts = {
      startDate: 0,
      endDate: Date.now(),
      reverse: true,
      limit: 1000,
    }
    const candleInterval = "all"
    const allStats = await accountStats.getTimeSeriesStats('candle', {
      timeFrame: getTimeFrame(candleInterval),
      ...opts
    })

    console.log('allStats:', allStats.series[0].value)

    for (const serie of allStats.series) {
      expect(serie.value.openTimestamp).toBeLessThan(serie.value.closeTimestamp)
      expect(serie.value.lowTimestamp).toBeLessThan(serie.value.highTimestamp)
      expect(serie.value.lowPrice).toBeLessThan(serie.value.highPrice)
      expect(serie.value.lowConfidence).toBeLessThan(serie.value.highConfidence)
      expect(serie.value.type).toBe('candle')
    }
  })
})
