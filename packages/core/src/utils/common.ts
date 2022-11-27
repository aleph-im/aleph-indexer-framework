import path from 'node:path'
import fs from 'node:fs'

// Get the date part in ISO format (UTC) for a timestamp
export function isoDate(timestamp: number, unit: 's' | 'ms' = 's'): string {
  const ts = timestamp * (unit === 's' ? 1000 : 1)
  return new Date(ts).toISOString().split('T')[0]
}

// Get the hour of the day (UTC) for a timestamp
export function isoHour(timestamp: number, unit: 's' | 'ms' = 's'): number {
  const ts = timestamp * (unit === 's' ? 1000 : 1)
  return new Date(ts).getUTCHours()
}

export function roundPrice(value: number, precision: number): number {
  const pow = 10 ** precision
  return Math.round(value * pow) / pow
}

function listMap<T>(
  a: T[],
  getKey?: (i: T) => string | number | symbol,
): Record<string | number | symbol, boolean> {
  const map = a.reduce((acc, curr) => {
    const k = getKey ? getKey(curr) : (curr as unknown as string)
    acc[k] = true
    return acc
  }, {} as Record<string | number | symbol, boolean>)

  return map
}

function listMinMaxMap<T>(
  a: T[],
  b: T[],
  getKey?: (i: T) => string | number | symbol,
): { min: T[]; max: T[]; map: Record<string | number | symbol, boolean> } {
  const [min, max] = a.length < b.length ? [a, b] : [b, a]
  const map = listMap(min, getKey)

  return { min, max, map }
}

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

export function listDedup<T>(
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

export function listSubstraction<T>(
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

export function sortTimeStatsMap<T extends { interval: string }>(
  map: Record<string, T>,
  reverse = false,
): T[] {
  const op = reverse ? -1 : 1
  return Object.values(map).sort(
    (a, b) => a.interval.localeCompare(b.interval) * op,
  )
}

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

export async function arrayFromAsyncIterator<T>(
  iterable: AsyncIterable<T>,
): Promise<T[]> {
  const arr = []
  for await (const item of iterable) arr.push(item)
  return arr
}
