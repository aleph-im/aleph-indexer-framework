import { jest } from '@jest/globals'
jest.useFakeTimers()

import { mergeIntervals, clipIntervals } from '../time.js'
import { Interval } from 'luxon'

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
    const intervals = [
      Interval.fromDateTimes(
        new Date('2021-07-19T05:33:21.000Z'),
        new Date('2022-07-31T21:11:06.000Z'),
      ),
      Interval.fromDateTimes(
        new Date('2021-07-19T05:33:21.000Z'),
        new Date('2022-07-31T21:18:10.000Z'),
      ),
      Interval.fromDateTimes(
        new Date('2022-07-31T21:18:10.001Z'),
        new Date('2022-07-31T21:49:41.000Z'),
      ),
    ]

    const merged = await mergeIntervals(intervals)

    expect(merged.newRanges.length).toBe(1)
    expect(merged.oldRanges.length).toBe(3)
    expect(merged.mergedRanges.length).toBe(1)

    expect(merged.mergedRanges[0].start).toEqual(intervals[0].start)
    expect(merged.mergedRanges[0].end).toEqual(intervals[2].end)
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
    const intervals = [
      Interval.fromDateTimes(
        new Date('2021-07-19T05:33:21.000Z'),
        new Date('2021-07-29T16:26:38.631Z'),
      ),
      Interval.fromDateTimes(
        new Date('2021-07-19T05:33:21.000Z'),
        new Date('2022-08-02T16:26:39.000Z'),
      ),
    ]

    const merged = await mergeIntervals(intervals)

    expect(merged.oldRanges.includes(intervals[0])).toBeTruthy()
    expect(merged.newRanges.length).toBe(0)
    expect(merged.mergedRanges.includes(intervals[1])).toBeTruthy()
  })

  it('clipDateRangesFromIterable should work', async () => {
    const stateInterval = Interval.fromDateTimes(
      new Date('2021-07-19T05:33:21.000Z'),
      new Date('2022-08-02T16:26:39.000Z'),
    )
    const intervals = [
      Interval.fromDateTimes(
        new Date('2021-07-19T05:33:21.000Z'),
        new Date('2021-07-29T16:26:38.631Z'),
      ),
      Interval.fromDateTimes(
        new Date('2021-07-19T05:33:21.000Z'),
        new Date('2022-08-02T16:26:39.000Z'),
      ),
    ]

    const clipped = await clipIntervals([stateInterval], intervals)

    expect(clipped.length).toBe(0)
  })
})
