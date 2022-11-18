import {jest} from '@jest/globals'
import {createAccountStats} from '../timeSeries.js'
import {mockEventDAL, mockStatsStateDAL, mockStatsTimeSeriesDAL,} from '../__mocks__/DAL.js'
import {mockMainIndexer} from "../__mocks__/indexer.js";
import {DateTime, Interval} from "luxon";
import {ParsedEvents} from "../../../utils/layouts/index.js";
import {EventStorage} from "../../../dal/event.js";
import {TimeFrame} from "@aleph-indexer/framework/dist/src/utils";
// jest.useFakeTimers()
jest.setTimeout(10000)

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

describe('AccountTimeSeries', () => {
  it('getStats with one event far in the past', async () => {
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

  it('getStats with many recent events', async () => {
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

  it('getTimeSeriesStats with some spread out events', async () => {
    const accountAddress = 'test'
    const testName = 'AccountStatsSomeSpreadOutEvents'
    const eventDAL = await mockEventDAL(testName, {
      eventCnt: 3,
      interval: Interval.fromDateTimes(DateTime.now().minus({year: 1}), DateTime.now())
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

    const dayStats = await accountStats.getTimeSeriesStats('access', {
      timeFrame: TimeFrame.Day
    })
    expect(dayStats.series.length).toBeGreaterThan(0)
    const accesses = dayStats.series.map(s => s.value.accesses).reduce((a, b) => a + b, 0)
    expect(accesses).toEqual(eventCnt)
  })
})