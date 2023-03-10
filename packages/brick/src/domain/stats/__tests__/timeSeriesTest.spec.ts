import { jest } from '@jest/globals'
import { createAccountStats } from '../timeSeries.js'
import {
  mockEventDAL,
  mockStatsStateDAL,
  mockStatsTimeSeriesDAL,
} from '../__mocks__/DAL.js'
import { mockMainIndexer } from '../__mocks__/indexer.js'
import { DateTime, Interval } from 'luxon'
import { ParsedEvents } from '../../../utils/layouts/index.js'
import { EventStorage } from '../../../dal/event.js'
import { TimeFrame } from '@aleph-indexer/framework/dist/src/utils'
// jest.useFakeTimers()
jest.setTimeout(30000)

async function mockAccountStats(
  eventDAL: EventStorage,
  account: string,
  testName: string,
) {
  const statsStateDAL = mockStatsStateDAL(testName)
  const statsTimeSeriesDAL = mockStatsTimeSeriesDAL(testName)
  const mainIndexer = await mockMainIndexer(eventDAL)
  return await createAccountStats(
    account,
    mainIndexer,
    eventDAL,
    statsStateDAL,
    statsTimeSeriesDAL,
  )
}

describe('AccountTimeSeries', () => {
  it('getStats with one event far in the past', async () => {
    const accountAddress = 'test'
    const testName = 'AccountStatsOneEventFarInThePast'
    const eventDAL = await mockEventDAL('AccountStatsOneEventFarInThePast', {
      eventCnt: 1,
      interval: Interval.fromDateTimes(
        new Date(2019, 1, 1),
        new Date(2019, 1, 1),
      ),
    })
    const accountStats = await mockAccountStats(
      eventDAL,
      accountAddress,
      testName,
    )

    const events = await eventDAL.getAll()
    let eventCnt = 0
    let earliest: ParsedEvents = {} as any
    for await (const event of events) {
      eventCnt++
      if (event.value.timestamp < earliest.timestamp || !earliest.timestamp) {
        earliest = event.value
      }
    }

    await accountStats.init()
    await accountStats.process(Date.now())
    const stats = await accountStats.getStats()
    expect(stats.stats.accessingPrograms.has(earliest.signer)).toBe(true)
    expect(stats.stats.total.accesses).toEqual(eventCnt)
  })

  it('getStats with many recent events', async () => {
    const accountAddress = 'test'
    const testName = 'AccountStatsManyRecentEvents'
    const eventDAL = await mockEventDAL(testName, {
      eventCnt: 100,
      interval: Interval.fromDateTimes(
        DateTime.now().minus({ day: 1 }),
        DateTime.now(),
      ),
    })
    const accountStats = await mockAccountStats(
      eventDAL,
      accountAddress,
      testName,
    )

    const events = await eventDAL.getAll()
    let eventCnt = 0
    for await (const event of events) {
      eventCnt++
    }

    await accountStats.init()
    await accountStats.process(Date.now())
    const stats = await accountStats.getStats()
    expect(stats.stats.total.accesses).toEqual(eventCnt)
    expect(stats.stats.accessingPrograms.size).toBeGreaterThan(0)
    expect(stats.stats.last7d.accesses).toEqual(eventCnt)
  })

  it('getTimeSeriesStats with many spread out events tested on accuracy', async () => {
    const accountAddress = 'test'
    const testName = 'AccountStatsSomeSpreadOutEvents'
    const eventDAL = await mockEventDAL(testName, {
      eventCnt: 1000,
      interval: Interval.fromDateTimes(
        DateTime.now().minus({ year: 1 }),
        DateTime.now(),
      ),
    })
    const accountStats = await mockAccountStats(
      eventDAL,
      accountAddress,
      testName,
    )

    let events = await eventDAL.getAll()
    let eventCnt = 0
    for await (const event of events) {
      eventCnt++
    }

    await accountStats.init()
    await accountStats.process(Date.now())
    const stats = await accountStats.getStats()
    expect(stats.stats.total.accesses).toEqual(eventCnt)
    expect(stats.stats.accessingPrograms.size).toBeGreaterThan(0)

    // Check day stats
    const dayStats = await accountStats.getTimeSeriesStats('access', {
      timeFrame: TimeFrame.Day,
    })
    expect(dayStats.series.length).toBeGreaterThan(0)
    const dayAccesses = dayStats.series
      .map((s) => s.value.accesses)
      .reduce((a, b) => a + b, 0)
    expect(dayAccesses).toEqual(eventCnt)
    events = await eventDAL.getAll()
    for await (const event of events) {
      const event_d = DateTime.fromMillis(event.value.timestamp)
      let eventFound = false
      dayStats.series.forEach((s) => {
        const series_d = DateTime.fromISO(s.date)
        if (series_d < event_d && event_d < series_d.plus({ day: 1 })) {
          expect(
            Object.keys(s.value.accessesByProgramId)?.find(
              (s) => s === event.value.signer,
            ),
          ).toBeDefined()
          eventFound = true
        }
      })
      expect(eventFound).toBe(true)
    }

    // Check week stats
    const weekStats = await accountStats.getTimeSeriesStats('access', {
      timeFrame: TimeFrame.Week,
    })
    expect(weekStats.series.length).toBeGreaterThan(0)
    const weekAccesses = weekStats.series
      .map((s) => s.value.accesses)
      .reduce((a, b) => a + b, 0)
    expect(weekAccesses).toEqual(eventCnt)
    events = await eventDAL.getAll()
    for await (const event of events) {
      const event_d = DateTime.fromMillis(event.value.timestamp)
      let eventFound = false
      weekStats.series.forEach((s) => {
        const series_d = DateTime.fromISO(s.date)
        if (series_d < event_d && event_d < series_d.plus({ week: 1 })) {
          expect(
            Object.keys(s.value.accessesByProgramId)?.find(
              (s) => s === event.value.signer,
            ),
          ).toBeDefined()
          eventFound = true
        }
      })
      expect(eventFound).toBe(true)
    }

    // Check month stats
    const monthStats = await accountStats.getTimeSeriesStats('access', {
      timeFrame: TimeFrame.Month,
    })
    expect(monthStats.series.length).toBeGreaterThan(0)
    const monthAccesses = monthStats.series
      .map((s) => s.value.accesses)
      .reduce((a, b) => a + b, 0)
    expect(monthAccesses).toEqual(eventCnt)
    events = await eventDAL.getAll()
    for await (const event of events) {
      const event_d = DateTime.fromMillis(event.value.timestamp)
      let eventFound = false
      monthStats.series.forEach((s) => {
        const series_d = DateTime.fromISO(s.date)
        if (series_d < event_d && event_d < series_d.plus({ month: 1 })) {
          expect(
            Object.keys(s.value.accessesByProgramId)?.find(
              (s) => s === event.value.signer,
            ),
          ).toBeDefined()
          eventFound = true
        }
      })
      expect(eventFound).toBe(true)
    }
  })
})
