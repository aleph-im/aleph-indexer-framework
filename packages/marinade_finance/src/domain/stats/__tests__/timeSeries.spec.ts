import { jest } from '@jest/globals'
jest.useFakeTimers()
jest.setTimeout(2000)

import {createAccountStats} from '../timeSeries.js'
import {
  mockEventDAL,
  mockStatsStateDAL,
  mockStatsTimeSeriesDAL,
} from '../__mocks__/DAL.js'
import {mockMainIndexer} from "../__mocks__/indexer.js";

describe('AccountTimeSeries', () => {
  it('createAccountStats from __mocks__ data', async () => {
    const accountStats = await createAccountStats(
      'test',
      mockMainIndexer(),
      mockEventDAL('AccountTimeSeries'),
      mockStatsStateDAL('AccountTimeSeries'),
      mockStatsTimeSeriesDAL('AccountTimeSeries')
    )

    console.log("generated accountStats")
    await accountStats.init()
    console.log("inited accountStats")
    await accountStats.process(Date.now())
    console.log("processed accountStats")
    const stats = await accountStats.getStats()
    console.log("got accountStats")
  })
})