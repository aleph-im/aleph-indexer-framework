import { sleep } from '../time.js'

/**
 * It keeps a concurrent fixed size buffer of pending promises.
 * When some of them finish, it takes another one from the provided iterator
 * @param {Iterator} it - A iterator function that returns promises
 * @param {number} concurrency - The max number of concurrent pending promises
 */
export async function concurrentPromises<T>(
  it: Iterator<Promise<unknown>, T>,
  concurrency = 20,
): Promise<T> {
  let done
  let lastValue!: T
  let lastIndex = Date.now()
  const pendingPromisesMap: Record<string, Promise<any>> = {}

  while (!done) {
    const next = it.next()
    const value = next.value

    if (next.done) {
      done = next.done
      lastValue = next.value
    }

    if (value instanceof Promise) {
      const currentIndex = Math.max(lastIndex, Date.now()) + 1
      lastIndex = currentIndex

      pendingPromisesMap[currentIndex] = (async () => {
        await value
        delete pendingPromisesMap[currentIndex]
      })()

      const promises = Object.values(pendingPromisesMap)
      if (promises.length >= concurrency) {
        await Promise.race(promises)
      }
    }
  }

  const promises = Object.values(pendingPromisesMap)
  await Promise.all(promises)

  return lastValue
}

/**
 * An util to create promises and control their lifecycle from other scope.
 * In other frameworks they usually call it "Deferred" too.
 *
 * Example:
 *```ts
 * function sleep(ms) {
 *   const future = new Future()
 *   setTimeout(() => future.resolve(), ms)
 *   return future.promise
 * }
 *
 * async function main() {
 *   await sleep(1000)
 * }
 * ```
 */
export class Future<T> {
  public resolve!: (value: T | PromiseLike<T>) => void
  public reject!: (reason?: any) => void
  public promise!: Promise<T>

  constructor() {
    this.promise = new Promise<T>((_res, _rej) => {
      this.resolve = _res
      this.reject = _rej
    })
  }
}

/**
 * An util for controlling concurrency (lock / unlock) forcing sequential access
 * to some region of the code
 *
 * Example:
 *
 * // Waits for the lock to be free and returns the releaser function
 * const release = await mutex.acquire()
 *
 * try {
 *   // Execute the concurrent safe code here
 * } finally {
 *   // Release the lock.
 *   // Ensures that the lock is always released, even if there are errors
 *   release()
 * }
 */
export class Mutex {
  protected queue = Promise.resolve()
  public count = 0

  async acquire(): Promise<() => void> {
    const release = new Future<void>()

    const currentQueue = this.queue
    this.queue = this.queue.then(() => release.promise)
    this.count++

    await currentQueue

    return () => {
      this.count--
      release.resolve()
    }
  }
}

/**
 * An util for retaining an unique snapshot of data while
 * the previous snapshot is being processed
 */
export class DebouncedJob<T> {
  protected pendingData: T | undefined
  protected pendingRun = false
  protected running = false
  protected lastRun = 0

  constructor(
    protected callback: (data: T) => Promise<void>,
    protected throttle: number = 0,
  ) {}

  async run(data: T): Promise<void> {
    this.pendingData = data
    this.pendingRun = true
    await this._run()
  }

  protected async _run(): Promise<void> {
    if (this.running) return
    this.running = true

    while (this.pendingRun) {
      const ts = this.lastRun + this.throttle - Date.now()
      if (ts > 0) await sleep(ts)

      const data = this.pendingData
      this.pendingData = undefined
      this.pendingRun = false

      this.lastRun = Date.now()
      await this.callback(data as T)
    }

    this.running = false
  }
}

/**
 * An util for buffering arbitrary items until a size condition
 * is fulfilled in which case an asynchronous drain method will be invoked
 */
export class BufferExec<T> {
  protected buffer: T[] = []
  protected timeout: NodeJS.Timeout | undefined
  protected lastDrain = Promise.resolve()

  constructor(
    protected exec: (items: T[]) => Promise<void>,
    protected size: number = 1000,
    protected time: number = 0,
  ) {}

  async add(item: T | T[]): Promise<void> {
    await this.lastDrain

    Array.isArray(item) ? this.buffer.push(...item) : this.buffer.push(item)

    if (!this.timeout && this.time > 0) {
      this.initTimeout()
    }

    if (this.buffer.length < this.size) return
    await this.drain()
  }

  drain(): Promise<void> {
    return (this.lastDrain = (async () => {
      await this.lastDrain

      let items = this.buffer
      this.buffer = []

      clearTimeout(this.timeout)
      this.timeout = undefined

      while (items.length) {
        const chunk = items.slice(0, this.size)
        items = items.slice(this.size)

        await this.exec(chunk)
      }
    })())
  }

  protected initTimeout(): void {
    this.timeout = setTimeout(
      () => this.drain().catch(() => 'ignore'),
      this.time,
    )
  }
}
