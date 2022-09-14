import { jest } from '@jest/globals'
jest.useFakeTimers()

import {
  mergeDateRangesFromIterable,
  clipDateRangesFromIterable,
} from '../time.js'

describe('Framework time utils', () => {
  it('mergeDateRangesFromIterable should work', async () => {
    const dateRanges = [
      {
        startDate: new Date('2021-07-19T05:33:21.000Z').valueOf(),
        endDate: new Date('2022-07-31T21:11:06.000Z').valueOf(),
      },
      {
        startDate: new Date('2021-07-19T05:33:21.000Z').valueOf(),
        endDate: new Date('2022-07-31T21:18:10.000Z').valueOf(),
      },
      {
        startDate: new Date('2022-07-31T21:18:10.001Z').valueOf(),
        endDate: new Date('2022-07-31T21:49:41.000Z').valueOf(),
      },
    ]

    const merged = await mergeDateRangesFromIterable(dateRanges)

    expect(merged.newRanges.length).toBe(1)
    expect(merged.oldRanges.length).toBe(3)
    expect(merged.mergedRanges.length).toBe(1)

    expect(merged.mergedRanges[0].startDate).toBe(dateRanges[0].startDate)
    expect(merged.mergedRanges[0].endDate).toBe(dateRanges[2].endDate)
  })

  it('mergeDateRangesFromIterable should work 2', async () => {
    const dateRanges = [
      {
        startDate: new Date('2021-07-19T05:33:21.000Z').valueOf(),
        endDate: new Date('2021-07-29T16:26:38.631Z').valueOf(),
      },
      {
        startDate: new Date('2021-07-19T05:33:21.000Z').valueOf(),
        endDate: new Date('2022-08-02T16:26:39.000Z').valueOf(),
      },
    ]

    const merged = await mergeDateRangesFromIterable(dateRanges)

    expect(merged.oldRanges.includes(dateRanges[0])).toBeTruthy()
    expect(merged.newRanges.length).toBe(0)
    expect(merged.mergedRanges.includes(dateRanges[1])).toBeTruthy()
  })

  it('clipDateRangesFromIterable should work', async () => {
    const stateRange = {
      startDate: new Date('2021-07-19T05:33:21.000Z').valueOf(),
      endDate: new Date('2022-08-02T16:26:39.000Z').valueOf(),
    }

    const dateRanges = [
      {
        startDate: new Date('2021-07-19T05:33:21.000Z').valueOf(),
        endDate: new Date('2021-07-29T16:26:38.631Z').valueOf(),
      },
      {
        startDate: new Date('2021-07-19T05:33:21.000Z').valueOf(),
        endDate: new Date('2022-08-02T16:26:39.000Z').valueOf(),
      },
    ]

    const clipped = await clipDateRangesFromIterable([stateRange], dateRanges)

    expect(clipped.length).toBe(0)
  })
})
