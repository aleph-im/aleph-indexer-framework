import { jest } from '@jest/globals'
jest.useFakeTimers()

import statsAggregator from '../statsAggregator.js'
import {mockStatsTimeSeriesDAL} from './__mocks__/DAL.js'

describe('StatsAggregator', () => {
  it('aggregate should work', async () => {
    await statsAggregator.aggregate({
      account: 'test',
      now: Date.now(),
      timeSeriesDAL: mockStatsTimeSeriesDAL()
    })
  })
})