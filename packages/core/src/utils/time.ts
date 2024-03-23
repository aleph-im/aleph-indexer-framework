import { DateTime, Interval, DateTimeUnit, DurationUnit, Settings } from 'luxon'

Settings.defaultZone = 'utc'
const zone = { zone: 'utc' }

// @todo: intervalSize > 1 are not working fine as intervals are calculated based on trades timestamps
// which generates relative intervals that may overlap (fix it by generating fixed intervals starting in startOf(parentUnit))

/**
 * @description Given a time interval (startDate, endDate), splits it in chunks of "intervalSize" * "intervalUnit" time intervals.
 * For example, if "intervalSize" = 10 and "intervalUnit" = 'day', it will split the interval (A, D) in N intervals: [(A, B), (B, C), (C, D)],
 * being the distance of each resulting interval (like (B, C)) of 10 days.
 * @param start - DateTime object or string in ISO format or timestamp in milliseconds
 * @param end - DateTime object or string in ISO format or timestamp in milliseconds
 * @param intervalUnit - The time units of each interval
 * @param intervalSize - The number of time units of each interval
 * @todo: Think about using luxon Interval.splitBy
 */
export function splitDurationIntoIntervals(
  start: DateTime | string | number,
  end: DateTime | string | number,
  intervalUnit: DateTimeUnit,
  intervalSize: number,
  preserveExactBounds = false,
): Interval[] {
  const startDate =
    typeof start === 'object'
      ? start
      : typeof start === 'string'
      ? DateTime.fromISO(start, zone)
      : DateTime.fromMillis(start, zone)

  const endDate =
    typeof end === 'object'
      ? end
      : typeof end === 'string'
      ? DateTime.fromISO(end, zone)
      : DateTime.fromMillis(end, zone)

  if (startDate > endDate) {
    return []
  }

  const length = startDate.equals(endDate)
    ? 1
    : Math.ceil(
        endDate
          .diff(startDate, intervalUnit as DurationUnit)
          .get(intervalUnit as DurationUnit) / intervalSize,
      )

  // Divide range (A, D) in chunks of intervalSize * intervalUnit time intervals
  // [(A, B), (B, C), (C, D)]
  const intervals: Interval[] = Array.from({ length }).map((x, i) => {
    const offset = i * intervalSize
    return Interval.fromDateTimes(
      startDate
        .plus({ [intervalUnit]: offset })
        .startOf(intervalUnit)
        .toUTC(),
      startDate
        .plus({ [intervalUnit]: offset + intervalSize })
        .startOf(intervalUnit)
        .toUTC(),
    )
  })

  // Override leftmost bound with "startDate" and rightmost bound with "endDate"
  // [(startDate, A), (A, B), (B, C), (C, endDate)]
  if (preserveExactBounds) {
    if (startDate) {
      intervals[0] = intervals[0].set({ start: startDate })
    }
    if (endDate) {
      intervals[intervals.length - 1] = intervals[intervals.length - 1].set({
        end: endDate,
      })
    }
  }

  // console.log(
  //   '📅 Intervals',
  //   intervals.map((interval) => interval.toISO()).join(', '),
  // )

  return intervals
}

export function sleep(ms = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ----------------- BACKOFF -------------------------

// https://activesphere.com/blog/2017/04/01/visualization-fo-backoff-functions
export interface BackoffOptions {
  factor?: number
  min?: number
  max?: number
  jitter?: boolean
}

export function logarithmicBackoff({
  factor = 1.5,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
}: BackoffOptions = {}): BackoffFunction {
  return (x: number) => {
    const next = min + x * (factor / 3) * Math.log(x + 1) // [min, N]
    return Math.min(max, next) // [min, max]
  }
}

export function linealBackoff({
  factor = 1.5,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
}: BackoffOptions = {}): BackoffFunction {
  return (x: number) => {
    const next = min + factor * x // [min, N]
    return Math.min(max, next) // [min, max]
  }
}

export function exponentialBackoff({
  factor = 1.5,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
}: BackoffOptions = {}): BackoffFunction {
  return (x: number) => {
    const next = min + Math.pow(factor, x) // [min, N]
    return Math.min(max, next) // [min, max]
  }
}

export function constantBackoff({
  factor = 1.5,
}: BackoffOptions = {}): BackoffFunction {
  return (x?: number) => factor
}

export type BackoffFunction = (x: number) => number

// TODO
export function getJitter(i: number, amplitude: number): number {
  return Math.random() * amplitude * (i || 1)
}
