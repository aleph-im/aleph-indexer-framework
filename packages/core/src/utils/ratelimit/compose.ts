import { RateLimitI } from './common.js'

export class ComposeRateLimit implements RateLimitI {
  constructor(protected _rateLimits: RateLimitI[] = []) {}

  check(now: number, weight: number): boolean {
    // Do not block execution if there are no rate limits (length = 0)
    let result = true

    for (const rateLimit of this._rateLimits) {
      result = result && rateLimit.check(now, weight)

      // Stop on first "false" (skiping rest of rate limits checks)
      if (!result) break
    }

    return result
  }

  nextTry(now: number, weight: number): number {
    return this._rateLimits.reduce((prevResult, rateLimit) => {
      const result = rateLimit.nextTry(now, weight)
      return Math.max(prevResult, result)
    }, 0)
  }

  add(now: number, weight: number): void {
    this._rateLimits.forEach((rateLimit) => rateLimit.add(now, weight))
  }

  sub(now: number, weight: number): void {
    this._rateLimits.forEach((rateLimit) => rateLimit.sub(now, weight))
  }
}
