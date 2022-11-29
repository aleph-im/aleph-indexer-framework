import {jest} from '@jest/globals'
import {DateTime, Duration, Interval} from "luxon";
import {getMostSignificantDurationUnitAndAmount, splitDurationIntoIntervals} from "../time.js";
// jest.useFakeTimers()
jest.setTimeout(10000)

describe('Time', () => {
  it('splitDurationIntoIntervals with days', async () => {
    const {unit, amount} = getMostSignificantDurationUnitAndAmount(Duration.fromObject({day: 5}))
    const intervals = splitDurationIntoIntervals(
      DateTime.now().minus({day: 30}),
      DateTime.now(),
      unit,
      amount
    )
    for (const interval of intervals) {
      expect(interval.length(unit)).toEqual(amount)
    }
    expect(intervals.length).toBeGreaterThanOrEqual(6)
    expect(intervals.length).toBeLessThanOrEqual(7)
  })

  it('splitDurationIntoIntervals with weird durations', async () => {
    const {unit, amount} = getMostSignificantDurationUnitAndAmount(Duration.fromObject({day: 65}))
    const intervals = splitDurationIntoIntervals(
      DateTime.now().minus({year: 1}),
      DateTime.now(),
      unit,
      amount
    )
    for (const interval of intervals) {
      expect(interval.length(unit)).toEqual(amount)
    }
    expect(intervals.length).toBeGreaterThanOrEqual(6)
    expect(intervals.length).toBeLessThanOrEqual(7)
  })
})