import { sleep, BackoffFunction, linealBackoff } from './time.js'

export interface TryAndRetryOpts {
  attemps: number
  t?: number
  errorFilter?: (e: Error) => boolean
  backoffFn?: BackoffFunction
}

export async function tryAndRetry<T>(
  fn: (...args: any) => Promise<T>,
  {
    attemps = 1,
    t = 0,
    errorFilter,
    backoffFn = linealBackoff(),
  }: TryAndRetryOpts = {} as any,
): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (t >= attemps) throw e
    if (errorFilter && errorFilter(e as Error)) throw e

    await sleep(backoffFn(t))

    return tryAndRetry(fn, {
      attemps,
      t: t + 1,
      backoffFn,
      errorFilter,
    })
  }
}

export function notImplemented(): void {
  throw new Error('Method not implemented.')
}
