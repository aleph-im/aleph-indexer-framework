import { jest } from '@jest/globals'
// jest.useFakeTimers()
jest.setTimeout(10000)

import {createAccountStats} from '../timeSeries.js'
import {
  mockEventDAL,
  mockStatsStateDAL,
  mockStatsTimeSeriesDAL,
} from '../__mocks__/DAL.js'
import {mockMainIndexer} from "../__mocks__/indexer.js";
import {Interval} from "luxon";
import {ParsedEvents} from "../../../utils/layouts";

describe('AccountTimeSeries', () => {
  it('createAccountStats from __mocks__ data', async () => {
    const eventDAL = await mockEventDAL('AccountTimeSeries')
    const statsStateDAL = mockStatsStateDAL('AccountTimeSeries')
    const statsTimeSeriesDAL = mockStatsTimeSeriesDAL('AccountTimeSeries')
    const mainIndexer = await mockMainIndexer(eventDAL)
    const accountStats = await createAccountStats(
      'test',
      mainIndexer,
      eventDAL,
      statsStateDAL,
      statsTimeSeriesDAL
    )
    const events = await eventDAL.getAll()
    let eventCnt = 0
    let earliest: ParsedEvents = {} as any
    let latest: ParsedEvents = {} as any
    for await (const event of events) {
      eventCnt++;
      if(eventCnt === 1) console.log(event)
      if(event.value.timestamp < earliest.timestamp || !earliest.timestamp) {
        earliest = event.value
      }
      if(event.value.timestamp > latest.timestamp || !latest.timestamp) {
        latest = event.value
      }
    }
    const accountState = await mainIndexer.getAccountState({account: 'test'})
    expect(earliest.timestamp).toEqual(Interval.fromISO(accountState!.processed[0]).start.toMillis())
    expect(latest.timestamp).toEqual(Interval.fromISO(accountState!.processed[0]).end.toMillis())
    await accountStats.init()
    await accountStats.process(Date.now())
    const stats = await accountStats.getStats()
    expect(Object.keys(stats.stats.accessingPrograms)[0]).toEqual(earliest.data.programId)
    expect(stats.stats.total.accesses).toEqual(eventCnt)
  })
})