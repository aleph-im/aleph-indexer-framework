import { RateLimitI } from './common.js'

export interface AccurateRateLimitConfigI {
  interval: number // in miliseconds
  limit: number
}

export class AccurateRateLimit implements RateLimitI {
  protected totalWeight = 0
  protected completedRequests: number[] = []
  protected completedRequestsWeight: Record<number, number> = {} // Record<time, weight>

  constructor(protected config: AccurateRateLimitConfigI) {}

  check(now: number, weight = 1): boolean {
    this.update(now)

    const newWeight = this.totalWeight + weight

    if (newWeight > this.config.limit) {
      return false
    }

    return true
  }

  add(now: number, weight = 1): void {
    this.totalWeight += weight
  }

  sub(now: number, weight = 1): void {
    const itemId = this._getAddItemId(now)
    this.completedRequestsWeight[itemId] = weight
    this.completedRequests.push(itemId)
  }

  nextTry(now: number, weight = 1): number {
    const leftLimit = now - this.config.interval
    let timeToWait = 0

    const availableWeight = this.config.limit - this.totalWeight // [0, limit]
    let neededWeight = Math.max(0, weight - availableWeight) // [0, weight]

    for (const itemId of this.completedRequests) {
      if (neededWeight <= 0) {
        break
      }

      if (itemId > leftLimit) {
        timeToWait = itemId - leftLimit // [1, N > leftLimit]
      }

      const itemWeight = this.completedRequestsWeight[itemId]
      neededWeight -= itemWeight
    }

    return timeToWait
  }

  protected _getAddItemId(now: number): number {
    const last = this.completedRequests[this.completedRequests.length - 1] || 0
    const res = now > last ? now : last + 1

    return res
  }

  protected update(now: number): void {
    if (this.totalWeight === 0) return

    const leftLimit = now - this.config.interval
    let i = 0

    while (i < this.completedRequests.length) {
      const itemId = this.completedRequests[i]

      if (itemId > leftLimit) {
        break
      }

      const itemWeight = this.completedRequestsWeight[itemId]

      this.totalWeight -= itemWeight
      delete this.completedRequestsWeight[itemId]

      i++
    }

    this.completedRequests = this.completedRequests.slice(i)
  }
}
