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

describe('AccountTimeSeries', () => {
  it('createAccountStats from __mocks__ data', async () => {
    const eventDAL = await mockEventDAL('AccountTimeSeries')
    const statsStateDAL = mockStatsStateDAL('AccountTimeSeries')
    const statsTimeSeriesDAL = mockStatsTimeSeriesDAL('AccountTimeSeries')
    const accountStats = await createAccountStats(
      'test',
      await mockMainIndexer(eventDAL),
      eventDAL,
      statsStateDAL,
      statsTimeSeriesDAL
    )
    const events = await eventDAL.getAll()
    let eventCnt = 0
    for await (const event of events) {
      eventCnt++;
      if(eventCnt === 1) console.log(event)
    }
    await accountStats.init()
    await accountStats.process(Date.now())
    const stats = await accountStats.getStats()
    console.log(stats)
    expect(stats.stats.total.accesses).toEqual(eventCnt)
  })
})