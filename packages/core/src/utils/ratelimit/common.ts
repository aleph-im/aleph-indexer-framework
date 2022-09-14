export interface RateLimitI {
  add(now: number, weight?: number): void
  sub(now: number, weight?: number): void
  check(now: number, weight?: number): boolean
  nextTry(now: number, weight?: number): number
}
