import { RateLimitI } from './common.js'

export interface ConcurrenceRateLimitConfigI {
  maxConcurrence: number
}

export class ConcurrenceRateLimit implements RateLimitI {
  protected pending = 0

  constructor(protected config: ConcurrenceRateLimitConfigI) {}

  check(): boolean {
    return this.pending < (this.config.maxConcurrence || 1)
  }

  add(): void {
    this.pending++
  }

  sub(): void {
    this.pending--
  }

  nextTry(): number {
    return 0
  }
}
