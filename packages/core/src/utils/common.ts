import path from 'node:path'
import fs from 'node:fs'

/**
 * Get the date part in ISO format (UTC) for a timestamp
 * @param timestamp The timestamp to get the date from
 * @param unit The unit of the timestamp. 's' for seconds, 'ms' for milliseconds
 */
export function isoDate(timestamp: number, unit: 's' | 'ms' = 's'): string {
  const ts = timestamp * (unit === 's' ? 1000 : 1)
  return new Date(ts).toISOString().split('T')[0]
}

/**
 * Get the hour of the day (UTC) for a timestamp
 * @param timestamp The timestamp to get the hour from
 * @param unit The unit of the timestamp. 's' for seconds, 'ms' for milliseconds
 */
export function isoHour(timestamp: number, unit: 's' | 'ms' = 's'): number {
  const ts = timestamp * (unit === 's' ? 1000 : 1)
  return new Date(ts).getUTCHours()
}

/**
 * Rounds a number to a given precision
 * @param value The number to round
 * @param precision The number of decimals to round to
 */
export function roundPrice(value: number, precision: number): number {
  const pow = 10 ** precision
  return Math.round(value * pow) / pow
}

/**
 * Maps a list to a record. The key of the record is the result of the `getKey` function.
 * @param a The list to map
 * @param getKey The function to get the key from the list item
 */
function listMap<T>(
  a: T[],
  getKey?: (i: T) => string | number | symbol,
): Record<string | number | symbol, boolean> {
  return a.reduce((acc, curr) => {
    const k = getKey ? getKey(curr) : (curr as unknown as string)
    acc[k] = true
    return acc
  }, {} as Record<string | number | symbol, boolean>)
}

/**
 * Compares the length of two lists and returns a {@link listMap} of the shorter list.
 * @param a The first list
 * @param b The second list
 * @param getKey The key mapping function to pass to {@link listMap}
 */
function listMinMaxMap<T>(
  a: T[],
  b: T[],
  getKey?: (i: T) => string | number | symbol,
): { min: T[]; max: T[]; map: Record<string | number | symbol, boolean> } {
  const [min, max] = a.length < b.length ? [a, b] : [b, a]
  const map = listMap(min, getKey)

  return { min, max, map }
}

/**
 * Creates an intersection of two lists. The result is a list of items that are present in both lists, given a key mapping function.
 * @param a The first list
 * @param b The second list
 * @param getKey The key mapping function by which to compare the list items
 */
export function listIntersection<T>(
  a: T[],
  b: T[],
  getKey?: (i: T) => string | number | symbol,
): T[] {
  const { max, map } = listMinMaxMap(a, b, getKey)

  return max.filter((curr) => {
    const k = getKey ? getKey(curr) : (curr as unknown as string)
    return map[k]
  })
}

/**
 * Creates a union of two lists. The result is a list of items that are present in either list, given a key mapping function.
 * @param a The first list
 * @param b The second list
 * @param getKey The key mapping function by which to compare the list items
 */
export function listUnion<T>(
  a: T[],
  b: T[],
  getKey?: (i: T) => string | number | symbol,
): T[] {
  const { min, max, map } = listMinMaxMap(a, b, getKey)

  return min.concat(
    max.filter((curr) => {
      const k = getKey ? getKey(curr) : (curr as unknown as string)
      return !map[k]
    }),
  )
}

/**
 * Subtracts a list from another list. The result is a list of items that are present in the first list, but not in the second list, given a key mapping function.
 * @param a The first list
 * @param b The second list
 * @param getKey The key mapping function by which to compare the list items
 */
export function listSubtraction<T>(
  a: T[],
  b: T[],
  getKey?: (i: T) => string | number | symbol,
): T[] {
  const map = listMap(b, getKey)

  return a.filter((curr) => {
    const k = getKey ? getKey(curr) : (curr as unknown as string)
    return !map[k]
  })
}

/**
 * Groups a list of items by a key mapping function into a record.
 * @param a The list to group
 * @param getKey The key mapping function by which to group the list items
 */
export function listGroupBy<T>(
  a: T[],
  getKey: (i: T) => string | number | symbol,
): Record<string | number | symbol, T[]> {
  return a.reduce((acc, curr) => {
    const k = getKey(curr)
    if (!acc[k]) {
      acc[k] = []
    }
    acc[k].push(curr)
    return acc
  }, {} as Record<string | number | symbol, T[]>)
}

/**
 * Sorts a map of items containing an `interval` property by the `interval` property.
 * @param map The map to sort
 * @param reverse Whether to reverse the sort
 */
export function sortTimeStatsMap<T extends { interval: string }>(
  map: Record<string, T>,
  reverse = false,
): T[] {
  const op = reverse ? -1 : 1
  return Object.values(map).sort(
    (a, b) => a.interval.localeCompare(b.interval) * op,
  )
}

/**
 * Ensures that a path exists. If it doesn't, it will be created.
 * @param dest The path to ensure
 */
export function ensurePath(dest: string): void {
  const paths = dest.split('/')
  let fullPath = ''

  for (const p of paths) {
    fullPath = path.join(fullPath, p)

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
    }
  }
}

/**
 * Iterates through an iterator and returns all items as an array.
 * @param iterable The iterator to iterate through
 */
export async function arrayFromAsyncIterator<T>(
  iterable: AsyncIterable<T>,
): Promise<T[]> {
  const arr = []
  for await (const item of iterable) arr.push(item)
  return arr
}
