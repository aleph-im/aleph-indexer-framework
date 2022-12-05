import {jest} from '@jest/globals'
import {createAccountStats} from '../timeSeries.js'
import {mockEventDAL, mockStatsStateDAL, mockStatsTimeSeriesDAL,} from '../__mocks__/DAL.js'
import {mockMainIndexer} from "../__mocks__/indexer.js";
import {DateTime, Duration, Interval} from "luxon";
import {ParsedEvents} from "../../../utils/layouts/index.js";
import {EventStorage} from "../../../dal/event.js";
import {AccountTimeSeriesStats} from "@aleph-indexer/framework/dist";
import {getMostSignificantDurationUnitAndAmount} from "@aleph-indexer/core/dist/utils";
import {StorageStream} from "@aleph-indexer/core/dist";
// jest.useFakeTimers()
jest.setTimeout(30000)

async function mockAccountStats(eventDAL: EventStorage, account: string, testName: string) {
  const statsStateDAL = mockStatsStateDAL(testName)
  const statsTimeSeriesDAL = mockStatsTimeSeriesDAL(testName)
  const mainIndexer = await mockMainIndexer(eventDAL)
  return await createAccountStats(
    account,
    mainIndexer,
    eventDAL,
    statsStateDAL,
    statsTimeSeriesDAL
  );
}

async function checkEventInStats(events: StorageStream<string, ParsedEvents>, stats: AccountTimeSeriesStats) {
  const notInStats = []
  const accesses = stats.series.map(s => s.value.accesses).reduce((a, b) => a + b, 0)
  for await (const event of events) {
    const event_d = DateTime.fromMillis(event.value.timestamp)
    let found = false
    for (const s of stats.series) {
      const series_d = DateTime.fromISO(s.date)
      if (series_d <= event_d && event_d < series_d.plus(stats.timeFrame)) {
        expect(Object.keys(s.value.accessesByProgramId)?.find(s => s === event.value.signer)).toBeDefined()
        found = true
        break
      }
    }
    if (!found) {
      notInStats.push(event)
    }
  }
  if(notInStats.length > 0) {
    const {unit, amount} = getMostSignificantDurationUnitAndAmount(stats.timeFrame)
    const timeFrameStr = `${amount}${unit}`
    console.log(`notIn${timeFrameStr}Stats`, JSON.stringify(notInStats, null, 2))
    console.log(`${timeFrameStr}Accesses`, accesses)
    console.log(`notIn${timeFrameStr}Stats.length`, notInStats.length)
  }
  expect(notInStats.length).toBe(0)
}

describe('AccountTimeSeries', () => {
  it.skip('getStats with one event far in the past', async () => {
    const accountAddress = 'test'
    const testName = 'AccountStatsOneEventFarInThePast'
    const eventDAL = await mockEventDAL('AccountStatsOneEventFarInThePast', {
      eventCnt: 1,
      interval: Interval.fromDateTimes(new Date(2019, 1, 1), new Date(2019, 1, 1))
    })
    const accountStats = await mockAccountStats(eventDAL, accountAddress, testName);

    const events = await eventDAL.getAll()
    let eventCnt = 0
    let earliest: ParsedEvents = {} as any
    for await (const event of events) {
      eventCnt++;
      if(event.value.timestamp < earliest.timestamp || !earliest.timestamp) {
        earliest = event.value
      }
    }

    await accountStats.init()
    await accountStats.process(Date.now())
    const stats = await accountStats.getStats()
    expect(stats.stats.accessingPrograms.has(earliest.signer)).toBe(true)
    expect(stats.stats.total.accesses).toEqual(eventCnt)
  })

  it.skip('getStats with many recent events', async () => {
    const accountAddress = 'test'
    const testName = 'AccountStatsManyRecentEvents'
    const eventDAL = await mockEventDAL(testName, {
      eventCnt: 100,
      interval: Interval.fromDateTimes(DateTime.now().minus({day: 1}), DateTime.now())
    })
    const accountStats = await mockAccountStats(eventDAL, accountAddress, testName);

    const events = await eventDAL.getAll()
    let eventCnt = 0
    for await (const event of events) {
      eventCnt++;
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
      interval: Interval.fromDateTimes(DateTime.now().minus({year: 1}), DateTime.now())
    })
    const accountStats = await mockAccountStats(eventDAL, accountAddress, testName);

    let events = await eventDAL.getAll()
    let eventCnt = 0
    for await (const event of events) {
      eventCnt++;
    }
    console.log('eventCnt', eventCnt)

    await accountStats.init()
    await accountStats.process(Date.now())

    // Check day stats
    const hourStats = await accountStats.getTimeSeriesStats('access', {
      timeFrame: Duration.fromDurationLike({days: 1}).toMillis(),
    })
    events = await eventDAL.getAll()
    await checkEventInStats(events, hourStats)

    // Check day stats
    const dayStats = await accountStats.getTimeSeriesStats('access', {
      timeFrame: Duration.fromDurationLike({days: 1}).toMillis(),
    })
    events = await eventDAL.getAll()
    await checkEventInStats(events, dayStats)

    // Check week stats
    const weekStats = await accountStats.getTimeSeriesStats('access', {
      timeFrame: Duration.fromDurationLike({weeks: 1}).toMillis(),
    })
    events = await eventDAL.getAll()
    await checkEventInStats(events, weekStats)

    // Check month stats
    const monthStats = await accountStats.getTimeSeriesStats('access', {
      timeFrame: Duration.fromDurationLike({months: 1}).toMillis(),
    })
    events = await eventDAL.getAll()
    await checkEventInStats(events, monthStats)
  })
})