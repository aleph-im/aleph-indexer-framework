import path from 'node:path'
import fs from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { promisify } from 'node:util'

const fsExists = promisify(fs.exists)

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

export function sortTimeStatsMap<T extends { interval: string }>(
  map: Record<string, T>,
  reverse = false,
): T[] {
  const op = reverse ? -1 : 1
  return Object.values(map).sort(
    (a, b) => a.interval.localeCompare(b.interval) * op,
  )
}

export async function ensurePath(dest: string): Promise<void> {
  const paths = dest.split('/')
  let fullPath = dest.startsWith('/') ? '/' : ''

  for (const p of paths) {
    fullPath = path.join(fullPath, p)

    const exists = await fsExists(fullPath)
    if (exists) continue

    await mkdir(fullPath, { recursive: true })
  }
}

export async function arrayFromAsyncIterator<T>(
  iterable: AsyncIterable<T>,
): Promise<T[]> {
  const arr = []
  for await (const item of iterable) arr.push(item)
  return arr
}

export function toSnakeCase(input: string): string {
  return toKebabCase(input).replace(/-/g, '_')
}

export function toKebabCase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\\-]/g, '')
    .replace(/_/g, '-')
}

export function toCamelCase(input: string): string {
  return toKebabCase(input).replace(/[-]+(.)?/g, (_, c) =>
    c ? c.toUpperCase() : '',
  )
}

export function capitalize(input: string): string {
  if (input.length === 0) return input
  return input.charAt(0).toUpperCase() + input.slice(1)
}
