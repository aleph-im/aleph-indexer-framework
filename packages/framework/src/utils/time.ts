import { Utils } from '@aleph-indexer/core'
import { DateTime, DateTimeUnit, Interval } from 'luxon'

const { splitDurationIntoIntervals } = Utils

/**
 * Enum for storing the different types of date ranges in level DB.
 * Gaps in between the ranges are for adding new ranges.
 */
export enum TimeFrame {
  Hour = 30,
  Day = 40,
  Week = 50,
  Month = 60,
  Year = 70,
  All = 99,
}

/**
 * Returns date units for a given time frame.
 */
export const TimeFrameDurationUnitsMap: Record<
  TimeFrame,
  [DateTimeUnit, number]
> = {
  [TimeFrame.Hour]: ['hour', 1],
  [TimeFrame.Day]: ['day', 1],
  [TimeFrame.Week]: ['week', 1],
  [TimeFrame.Month]: ['month', 1],
  [TimeFrame.Year]: ['year', 1],
  [TimeFrame.All]: ['year', Number.MAX_SAFE_INTEGER],
}

/**
 * A simple date range object using unix timestamps.
 */
export type DateRange = {
  startDate: number
  endDate: number
}

/**
 * Returns custom date ranges for a given interval.
 * @param interval If string, it should be in ISO 8601 format.
 */
export function getDateRangeFromInterval(
  interval: Interval | string,
): DateRange {
  const { start, end } =
    typeof interval === 'string' ? Interval.fromISO(interval) : interval
  return { startDate: start.toMillis(), endDate: end.toMillis() }
}

/**
 * Returns Interval objects for our custom date ranges.
 * @param dateRange Date range to convert to Interval.
 */
export function getIntervalFromDateRange(dateRange: DateRange): Interval {
  return Interval.fromDateTimes(
    DateTime.fromMillis(dateRange.startDate).toUTC(),
    DateTime.fromMillis(dateRange.endDate).toUTC(),
  )
}

// Clip date ranges utils

export type DateRangeArrayOrMap = DateRange[] | Record<string, DateRange>

function clipDateRanges(
  ranges: Record<string, DateRange>,
  clipRange: DateRange,
): Record<string, DateRange> {
  for (const [currentId, currentRange] of Object.entries(ranges)) {
    // @note: Clipping on the middle
    if (
      clipRange.startDate > currentRange.startDate &&
      clipRange.startDate < currentRange.endDate &&
      clipRange.endDate > currentRange.startDate &&
      clipRange.endDate < currentRange.endDate
    ) {
      const leftRange = {
        startDate: currentRange.startDate,
        endDate: clipRange.startDate - 1,
      }
      const rightRange = {
        startDate: clipRange.endDate + 1,
        endDate: currentRange.endDate,
      }

      const leftId = `${leftRange.startDate}${leftRange.endDate}`
      const rightId = `${rightRange.startDate}${rightRange.endDate}`

      ranges[leftId] = leftRange
      ranges[rightId] = rightRange
      delete ranges[currentId]
    }
    // @note: Clipping from the left
    else if (
      clipRange.startDate <= currentRange.startDate &&
      clipRange.endDate >= currentRange.startDate &&
      clipRange.endDate < currentRange.endDate
    ) {
      const rightRange = {
        startDate: clipRange.endDate + 1,
        endDate: currentRange.endDate,
      }

      const rightId = `${rightRange.startDate}${rightRange.endDate}`

      ranges[rightId] = rightRange
      delete ranges[currentId]
    }
    // @note: Clipping from the right
    else if (
      clipRange.endDate >= currentRange.endDate &&
      clipRange.startDate <= currentRange.endDate &&
      clipRange.startDate > currentRange.startDate
    ) {
      const leftRange = {
        startDate: currentRange.startDate,
        endDate: clipRange.startDate - 1,
      }

      const leftId = `${leftRange.startDate}${leftRange.endDate}`

      ranges[leftId] = leftRange
      delete ranges[currentId]
    }
    // @note: Clipping the whole range
    else if (
      clipRange.startDate <= currentRange.startDate &&
      clipRange.endDate >= currentRange.endDate
    ) {
      delete ranges[currentId]
    }
  }

  return ranges
}

/**
 * @todo: needs a better function name, idk what it exactly does but it also sorts the ranges
 * @param ranges
 * @param clipRanges
 * @param log
 */
export async function clipDateRangesFromIterable<T extends DateRangeArrayOrMap>(
  ranges: T,
  clipRanges: Iterable<DateRange> | AsyncIterable<DateRange>,
): Promise<T> {
  let map: Record<string, DateRange> = Array.isArray(ranges)
    ? Object.fromEntries(
        ranges.map((range) => [`${range.startDate}${range.endDate}`, range]),
      )
    : ranges

  for await (const range of clipRanges) {
    map = clipDateRanges(map, range)
  }

  return Array.isArray(ranges)
    ? Object.values(map).sort((a, b) => a.startDate - b.startDate)
    : (map as any)
}

// Merge date ranges utils

// @note: Ranges should be sorted in ascending order
export async function mergeDateRangesFromIterable(
  mergeRanges: Iterable<DateRange> | AsyncIterable<DateRange>,
): Promise<{
  mergedRanges: DateRange[]
  oldRanges: DateRange[]
  newRanges: DateRange[]
}> {
  const mergedRanges: DateRange[] = []
  const oldRanges: DateRange[] = []
  const newRanges: DateRange[] = []
  let prevRange: DateRange | undefined
  let prevMerged = false

  for await (const range of mergeRanges) {
    // @note: Fix invalid ranges
    if (range.endDate < range.startDate) {
      const fixedRange = {
        startDate: range.endDate,
        endDate: range.endDate,
      }
      oldRanges.push(range)
      newRanges.push(fixedRange)
      continue
    }

    if (!prevRange) {
      prevRange = range
      continue
    }

    // @note: Merge adjacent ranges
    if (prevRange.endDate >= range.startDate - 1) {
      const unionRange = {
        startDate: prevRange.startDate,
        endDate: Math.max(prevRange.endDate, range.endDate),
      } as DateRange

      const equalToRange = isEqualDateRange(range, unionRange)
      const equalToPrevRange = isEqualDateRange(prevRange, unionRange)

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

export function getTimeFrameOptions(
  timeFrame: TimeFrame,
  interval: Interval,
): [DateTime, DateTime, DateTimeUnit, number] {
  const duration = TimeFrameDurationUnitsMap[timeFrame]

  switch (timeFrame) {
    case TimeFrame.Hour:
    case TimeFrame.Day:
    case TimeFrame.Week:
    case TimeFrame.Month:
    case TimeFrame.Year:
    case TimeFrame.All: {
      return [interval.start, interval.end, ...duration]
    }
  }
}

// @todo: Create a generator function instead for not filling memory on tiny time frames or/and large intervals
export function getTimeFrameIntervals(
  interval: Interval,
  timeFrame: TimeFrame,
  reverse = false,
): Interval[] {
  if (timeFrame === TimeFrame.All) {
    return [
      Interval.fromISO('1970-01-01T00:00:00.000Z/2285-01-01T00:00:00.000Z'),
    ]
  }

  const options = getTimeFrameOptions(timeFrame, interval)
  const ranges = splitDurationIntoIntervals(...options)
  return reverse ? ranges.reverse() : ranges
}

export function getPreviousInterval(
  interval: Interval,
  timeFrame: TimeFrame,
  reverse = false,
): Interval {
  if (timeFrame === TimeFrame.All)
    throw new Error('TimeFrame.All does not have a prev interval')

  const [unit, num] = TimeFrameDurationUnitsMap[timeFrame]
  const durationObj = { [unit]: num }

  return reverse
    ? Interval.after(interval.end, durationObj)
    : Interval.before(interval.start, durationObj)
}

export function getNextInterval(
  interval: Interval,
  timeFrame: TimeFrame,
  reverse = false,
): Interval {
  if (timeFrame === TimeFrame.All)
    throw new Error('TimeFrame.All does not have a next interval')

  const [unit, num] = TimeFrameDurationUnitsMap[timeFrame]
  const durationObj = { [unit]: num }

  return reverse
    ? Interval.before(interval.start, durationObj)
    : Interval.after(interval.end, durationObj)
}
