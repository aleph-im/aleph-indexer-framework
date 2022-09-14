import { RateLimitI } from './common.js'

export interface SparseRateLimitConfigI {
  interval: number // in miliseconds
  limit: number
  fixedWeight?: number
}

export class SparseRateLimit implements RateLimitI {
  protected _sparseLockWeight = 0
  protected _sparseLastRefillTime = 0
  protected _sparseInterval =
    Math.ceil((this.config.interval / this.config.limit) * 100) / 100

  constructor(protected config: SparseRateLimitConfigI) {}

  getRateLimitWeight(weight = 1): number {
    if (this.config.fixedWeight) {
      return this.config.fixedWeight
    }
    return weight
  }

  check(now: number): boolean {
    this._updateState(now)
    return this._check()
  }

  add(now: number, weight = 1): void {
    const rateLimitWeight = this.getRateLimitWeight(weight)
    this._sparseLockWeight += rateLimitWeight
  }

  sub(now: number): void {
    if (this._sparseLastRefillTime === 0) {
      this._sparseLastRefillTime = now
    }
  }

  nextTry(now: number): number {
    if (this._sparseLastRefillTime === 0) return 0

    const elapsedTime = now - this._sparseLastRefillTime
    const totalToWait = this._sparseLockWeight * this._sparseInterval // [0, t]

    return Math.max(0, totalToWait - elapsedTime) // [0, t]
  }

  protected _updateState(now: number): void {
    if (this._sparseLastRefillTime === 0) return

    const elapsedTime = now - this._sparseLastRefillTime
    const totalRefill = Math.trunc(elapsedTime / this._sparseInterval) // [0, N]
    const substractWeight = Math.min(totalRefill, this._sparseLockWeight) // [0, sparseLockWeight]

    this._sparseLockWeight -= substractWeight

    if (elapsedTime > this.config.interval && this._sparseLockWeight === 0) {
      this._sparseLastRefillTime = 0
    } else {
      this._sparseLastRefillTime += totalRefill * this._sparseInterval // Z * Z => Z
    }
  }

  protected _check(): boolean {
    return this._sparseLockWeight === 0
  }
}
