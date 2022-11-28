import { Utils } from '@aleph-indexer/core'
import {DateTime, DateTimeUnit, Duration, Interval} from 'luxon'

const { splitDurationIntoIntervals } = Utils

export type DateRange = {
  startDate: number,
  endDate: number
}

export const MAX_TIMEFRAME = Duration.fromDurationLike({year: 315});
// @todo: move time utils from framework to core
/**
 * Returns custom date ranges for a given interval.
 * @param interval If string, it should be in ISO 8601 format.
 */
export function toInterval(
  interval: Interval | string,
): Interval {
  return typeof interval === 'string' ? Interval.fromISO(interval) : interval
}

export function candleIntervalToDuration(
  candleInterval: string,
): Duration {
  candleInterval = candleInterval.toLowerCase()
  const count = candleInterval.match(/\d+/)?.[0]
  if (!count) {
    if(candleInterval !== 'all') {
      throw new Error(`Invalid candle interval: ${candleInterval}`)
    }
    return MAX_TIMEFRAME
  }
  const unit = candleInterval.replace(count, '') as DateTimeUnit
  return Duration.fromObject({[unit]: parseInt(count)})
}

/**
 * Returns Interval objects for our custom date ranges.
 * @param startTime
 * @param endTime
 */
export function getIntervalFromDateRange(startTime: number, endTime: number): Interval {
  return Interval.fromDateTimes(
    DateTime.fromMillis(startTime).toUTC(),
    DateTime.fromMillis(endTime).toUTC(),
  )
}

export async function generatorToArray<T>(generator: AsyncIterable<T> | Iterable<T>): Promise<T[]> {
  const arr: T[] = []
  for await (const item of generator) {
    arr.push(item)
  }
  return arr
}

// Clip date ranges utils

export type IntervalArrayOrMap = Interval[] | Record<string, Interval>

/**
 * Clips away intervals, which lie within the clipRange.
 * @param intervals The intervals to clip.
 * @param clipRange Single or multiple intervals to clip away.
 */
function clipIntervals(
  intervals: Interval[],
  clipRange: Interval,
): Interval[] {
  for (const [i, currentRange] of intervals.entries()) {
    // @note: Clipping on the middle
    if (
      clipRange.start > currentRange.start &&
      clipRange.start < currentRange.end &&
      clipRange.end > currentRange.start &&
      clipRange.end < currentRange.end
    ) {
      const leftRange = Interval.fromDateTimes(
        currentRange.start,
        clipRange.start.minus({millisecond: 1})
      )
      const rightRange = Interval.fromDateTimes(
        clipRange.end.plus({millisecond: 1}),
        currentRange.end,
      )

      intervals.splice(i, 1, leftRange, rightRange)
    }
    // @note: Clipping from the left
    else if (
      clipRange.start <= currentRange.start &&
      clipRange.end >= currentRange.start &&
      clipRange.end < currentRange.end
    ) {
      const rightRange = Interval.fromDateTimes(
        clipRange.end.plus({millisecond: 1}),
        currentRange.end,
      )

      intervals.splice(i, 1, rightRange)
    }
    // @note: Clipping from the right
    else if (
      clipRange.end >= currentRange.end &&
      clipRange.start <= currentRange.end &&
      clipRange.start > currentRange.start
    ) {
      const leftRange = Interval.fromDateTimes(
        currentRange.start,
        clipRange.start.plus({millisecond: 1}),
      )

      intervals.splice(i, 1, leftRange)
    }
    // @note: Clipping the whole range
    else if (
      clipRange.start <= currentRange.start &&
      clipRange.end >= currentRange.end
    ) {
      intervals.splice(i, 1)
    }
  }

  return Object.values(intervals)
}

export function sortIntervals(intervals: Interval[]): Interval[] {
  return Object.values(intervals).sort((a, b) => a.start.toMillis() - b.start.toMillis())
}

/**
 * Clips and sorts intervals by the given clip ranges.
 * @param intervals The intervals to parse, clip and sort.
 * @param clipRange The interval to clip away.
 */
export async function prepareIntervals(
  intervals: Interval[],
  clipRange: Interval,
): Promise<Interval[]> {
  return sortIntervals(
    clipIntervals(intervals, clipRange)
  )
}

/**
 * Merges intervals that are overlapping or adjacent, to reduce the number of intervals.
 * @note: Ranges need to be sorted in ascending order as well as of the same type.
 * @param mergeRanges The intervals to merge.
 */
export async function mergeIntervals(
  mergeRanges: Iterable<Interval> | AsyncIterable<Interval>,
): Promise<{
  mergedRanges: Interval[]
  oldRanges: Interval[]
  newRanges: Interval[]
}> {
  const mergedRanges: Interval[] = []
  const oldRanges: Interval[] = []
  const newRanges: Interval[] = []
  let prevRange: Interval | undefined
  let prevMerged = false

  for await (const range of mergeRanges) {
    if (!prevRange) {
      prevRange = range
      continue
    }

    // @note: Merge adjacent ranges
    if (prevRange.end.toMillis() >= range.start.toMillis() - 1) {
      const unionRange = Interval.fromDateTimes(
        prevRange.start,
        range.end > prevRange.end ? range.end : prevRange.end,
      )

      const equalToRange = range.equals(unionRange)
      const equalToPrevRange = prevRange.equals(unionRange)

      if (!equalToRange) {
        oldRanges.push(range)
      }

      if (!prevMerged && !equalToPrevRange) {
        oldRanges.push(prevRange)
      }

      prevMerged = !equalToRange && !equalToPrevRange
      prevRange = equalToRange
        ? range
        : equalToPrevRange
        ? prevRange
        : unionRange

      continue
    }

    mergedRanges.push(prevRange)
    if (prevMerged) newRanges.push(prevRange)

    prevMerged = false
    prevRange = range
  }

  if (prevRange) {
    mergedRanges.push(prevRange)
    if (prevMerged) newRanges.push(prevRange)
  }

  return {
    mergedRanges,
    oldRanges,
    newRanges,
  }
}

export function isEqualDateRange(a: DateRange, b: DateRange): boolean {
  return a.startDate === b.startDate && a.endDate === b.endDate
}

// @todo: Create a generator function instead for not filling memory on tiny time frames or/and large intervals
export function getTimeFrameIntervals(
  interval: Interval,
  timeFrame: Duration,
  reverse = false,
): Interval[] {
  if (timeFrame.equals(MAX_TIMEFRAME)) {
    return [
      Interval.fromISO('1970-01-01T00:00:00.000Z/2285-01-01T00:00:00.000Z'),
    ]
  }

  const { unit, size } = getMostSignificantDurationUnitAndSize(timeFrame)
  const ranges = splitDurationIntoIntervals(interval.start, interval.end, unit, size)
  return reverse ? ranges.reverse() : ranges
}

export function getMostSignificantDurationUnitAndSize(timeFrame: Duration): { unit: DateTimeUnit, size: number } {
  timeFrame.shiftTo()
  if(timeFrame.years !== 0) {
    return { unit: "year", size: timeFrame.years }
  }
  if(timeFrame.months !== 0) {
    return { unit: "month", size: timeFrame.months }
  }
  if(timeFrame.weeks !== 0) {
    return { unit: "week", size: timeFrame.weeks }
  }
  if(timeFrame.days !== 0) {
    return { unit: "day", size: timeFrame.days }
  }
  if(timeFrame.hours !== 0) {
    return { unit: "hour", size: timeFrame.hours }
  }
  if(timeFrame.minutes !== 0) {
    return { unit: "minute", size: timeFrame.minutes }
  }
  if(timeFrame.seconds !== 0) {
    return { unit: "second", size: timeFrame.seconds }
  }
  if(timeFrame.milliseconds !== 0) {
    return { unit: "millisecond", size: timeFrame.milliseconds }
  }
  throw new Error("Invalid time frame")
}

export function getPreviousInterval(
  interval: Interval,
  timeFrame: Duration,
  reverse = false,
): Interval {
  if (timeFrame.equals(MAX_TIMEFRAME))
    throw new Error('TimeFrame.All does not have a prev interval')

  const { unit, size } = getMostSignificantDurationUnitAndSize(timeFrame)
  const durationObj = { [unit]: size }
  Interval.fromDateTimes(interval.start.minus(durationObj), interval.end.minus(durationObj))

  return reverse
    ? Interval.after(interval.end, durationObj)
    : Interval.before(interval.start, durationObj)
}

export function getNextInterval(
  interval: Interval,
  timeFrame: Duration,
  reverse = false,
): Interval {
  if (timeFrame.equals(MAX_TIMEFRAME))
    throw new Error('TimeFrame.All does not have a next interval')

  const { unit, size } = getMostSignificantDurationUnitAndSize(timeFrame)
  const durationObj = { [unit]: size }
  Interval.fromDateTimes(interval.start.minus(durationObj), interval.end.minus(durationObj))

  return reverse
    ? Interval.after(interval.start, durationObj)
    : Interval.before(interval.end, durationObj)
}