import { jest } from '@jest/globals'
import {DateTime, Interval} from 'luxon'
jest.useFakeTimers()

import {
  mergeIntervals,
  clipIntervalsByAnyInterval,
} from '../time.js'

describe('Framework time utils', () => {
  it('mergeDateRangesFromIterable should work', async () => {
    const intervals = [
      Interval.fromDateTimes(
        DateTime.fromISO('2021-07-19T05:33:21.000Z'),
        DateTime.fromISO('2022-07-31T21:11:06.000Z')
      ),
      Interval.fromDateTimes(
        DateTime.fromISO('2021-07-19T05:33:21.000Z'),
        DateTime.fromISO('2022-07-31T21:18:10.000Z')
      ),
      Interval.fromDateTimes(
        DateTime.fromISO('2022-07-31T21:18:10.001Z'),
        DateTime.fromISO('2022-07-31T21:49:41.000Z')
      )
    ]

    const merged = await mergeIntervals(intervals)

    expect(merged.newRanges.length).toBe(1)
    expect(merged.oldRanges.length).toBe(3)
    expect(merged.mergedRanges.length).toBe(1)

    expect(merged.mergedRanges[0].start).toBe(intervals[0].start)
    expect(merged.mergedRanges[0].end).toBe(intervals[2].end)
  })

  it('mergeDateRangesFromIterable should work 2', async () => {
    const intervals = [
      Interval.fromDateTimes(
        DateTime.fromISO('2021-07-19T05:33:21.000Z'),
        DateTime.fromISO('2021-07-29T16:26:38.631Z')
      ),
      Interval.fromDateTimes(
        DateTime.fromISO('2021-07-19T05:33:21.000Z'),
        DateTime.fromISO('2022-08-02T16:26:39.000Z')
      )
    ]

    const merged = await mergeIntervals(intervals)

    expect(merged.oldRanges.includes(intervals[0])).toBeTruthy()
    expect(merged.newRanges.length).toBe(0)
    expect(merged.mergedRanges.includes(intervals[1])).toBeTruthy()
  })

  it('clipDateRangesFromIterable should work', async () => {
    const stateRange = Interval.fromDateTimes(
      DateTime.fromISO('2021-07-19T05:33:21.000Z'),
      DateTime.fromISO('2022-08-02T16:26:39.000Z')
    )

    const dateRanges = [
      Interval.fromDateTimes(
        DateTime.fromISO('2021-07-19T05:33:21.000Z'),
        DateTime.fromISO('2021-07-29T16:26:38.631Z')
      ),
      Interval.fromDateTimes(
        DateTime.fromISO('2021-07-19T05:33:21.000Z'),
        DateTime.fromISO('2022-08-02T16:26:39.000Z')
      )
    ]

    const clipped = await clipIntervalsByAnyInterval([stateRange], dateRanges)

    expect(clipped.length).toBe(0)
  })
})
