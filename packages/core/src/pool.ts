/* eslint-disable no-constant-condition */
import { TokenInfo } from '@solana/spl-token-registry'
import { DateTime } from 'luxon'
import { Mutex, sleep } from './utils/index.js'

export type PoolInfo = {
  name: string
  address: string
  lp?: TokenInfo
  programId: string
}
//  & (
//   | {
//       coin: TokenInfo
//       pc: TokenInfo
//       baseToken?: undefined
//       quoteToken?: undefined
//     }
//   | {
//       coin?: undefined
//       pc?: undefined
//       baseToken: TokenInfo
//       quoteToken: TokenInfo
//     }
// )

export abstract class SolanaPool<PI extends PoolInfo = PoolInfo, PS = any> {
  constructor(public info: PI, public stats: PS) {}

  abstract init(): Promise<void>
  abstract updateStats(now?: DateTime): void | Promise<void>
  abstract clearStatsCache(now?: DateTime): void | Promise<void>
}

export abstract class SolanaPools<P extends SolanaPool = SolanaPool> {
  protected pools: Record<string, P> = {}
  protected loadMutex = new Mutex()
  protected lastClear = 0

  async init(index?: number, total?: number): Promise<void> {
    await this.loadPools(index, total)

    await Promise.all(
      Object.values(this.pools).map(async (pool) => pool.init()),
    )

    // @note: Doing it on background improve api consumer awaiting times
    ;(async () => {
      while (true) {
        try {
          const now = DateTime.now()

          // @note: Clear stats older than startTime 1h 30'
          if (now.toMillis() > this.lastClear + 1000 * 60 * 60 * 1.5) {
            await Promise.all(
              Object.values(this.pools).map(async (pool) =>
                pool.clearStatsCache(now),
              ),
            )

            this.lastClear = now.toMillis()
          }

          await Promise.all(
            Object.values(this.pools).map(async (pool) =>
              pool.updateStats(now),
            ),
          )

          await this.updateStats(now)
        } catch (e) {
          console.log((e as Error).message)
          // @note: In case there is some error calculating stats
          // do not exit the loop, as it could be a temporal network issue
        }

        await sleep(1000 * 60)
      }
    })()
  }

  protected abstract updateStats(now?: DateTime): void | Promise<void>

  addPool(pool: P): this {
    this.pools[pool.info.address] = pool
    return this
  }

  poolExists(address: string): boolean {
    return !!this.pools[address]
  }

  async getPools(): Promise<Record<string, P>> {
    await this.loadPools()

    return this.pools
  }

  async getPool(address: string): Promise<P | undefined> {
    await this.loadPools()
    const pool = this.pools[address]

    return pool
  }

  async getPoolByName(name: string): Promise<P | undefined> {
    await this.loadPools()
    const pool = Object.values(this.pools).find(
      (pool) => pool.info.name === name,
    )

    return pool
  }

  protected async loadPools(index?: number, total?: number): Promise<void> {
    if (Object.keys(this.pools).length > 0) return

    const release = await this.loadMutex.acquire()

    try {
      await this._loadPools(index, total)
    } finally {
      release()
    }
  }

  protected abstract _loadPools(index?: number, total?: number): Promise<void>
}
