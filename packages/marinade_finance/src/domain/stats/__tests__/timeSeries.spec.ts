import { jest } from '@jest/globals'
jest.useFakeTimers()

import {createAccountStats} from '../timeSeries.js'
import {
  mockEventDAL,
  mockStatsStateDAL,
  mockStatsTimeSeriesDAL,
} from './__mocks__/DAL.js'
import {mockMainIndexer} from "./__mocks__/indexer.js";

describe('AccountTimeSeries', () => {
  it('createAccountStats from __mocks__ data', async () => {
    await createAccountStats(
      'test',
      mockMainIndexer(),
      await mockEventDAL(),
      mockStatsStateDAL(),
      mockStatsTimeSeriesDAL()
    )
  })
})