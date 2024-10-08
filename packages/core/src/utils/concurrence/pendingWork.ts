import { StorageEntry } from '../../storage/index.js'
import { MAX_TIMER_INTEGER } from '../constants.js'
import { concurrentPromises, DebouncedJobRunner, Mutex } from './common.js'
import { PendingWorkDAL, PendingWorkDALIndex } from './dal/pendingWork.js'
import { JobRunner } from './jobRunner.js'

export * from './dal/pendingWork.js'

/**
 * A pending work item
 */
export type PendingWork<T> = {
  id: string
  time: number
  payload: T
}

/**
 * Options for the pending work pool
 * @template T The type of the payload
 * @property id - The id of the pool
 * @property dal - The data access layer
 * @property interval - The interval to run the pool
 * @property concurrency - The number of concurrent jobs to run
 * @property maxQueueSize - The max number of works to queue
 * @property chunkSize - The number of works to fetch at once
 * @property handleWork - The function to handle the works
 * @property checkComplete - The function to check if a work is complete
 * @property preCheckComplete - Whether to check if a work is complete before
 * handling it
 */
export interface PendingWorkOptions<T> {
  id: string
  dal: PendingWorkDAL<T>
  interval: number
  concurrency: number
  maxQueueSize?: number
  chunkSize: number
  handleWork: (
    works: PendingWork<T>[],
  ) => Promise<number | void> | number | void
  checkComplete?: (work: PendingWork<T>) => Promise<boolean> | boolean
  preCheckComplete?: boolean
}

/**
 * Error thrown when the pending work queue is full
 */
export class QueueFullError extends Error {
  constructor(protected pendingWork: PendingWorkPool<any>) {
    super(
      `Queue (max size: ${pendingWork.options.maxQueueSize}) is full for ${pendingWork.options.id}`,
    )
  }
}

/**
 * A pool of pending works. It will run the works in the pool at a given interval
 * or when new works arrive. It will also check if the works are complete before
 * running them. If they are, it will remove them from the pool.
 * @note If the interval is 0, it will only run when new works arrive.
 * @template T The type of the payload
 * @property options The options of the pool
 */
export class PendingWorkPool<T> {
  protected skipSleep = false
  protected debouncedJob: DebouncedJobRunner | undefined
  protected coordinatorJob: JobRunner | undefined

  constructor(public readonly options: PendingWorkOptions<T>) {
    const name = `${this.options.id} 🔄`

    // @note: If interval is 0, run it only when new items arrive
    if (!this.options.interval) {
      this.debouncedJob = new DebouncedJobRunner({
        name,
        callbackFn: this.runJob.bind(this),
      })
    } else {
      this.coordinatorJob = new JobRunner({
        name,
        interval: this.options.interval,
        intervalFn: this.runJob.bind(this),
      })
    }
  }

  async start(): Promise<void> {
    this.coordinatorJob && this.coordinatorJob.run().catch(() => 'ignore')
    this.debouncedJob && this.debouncedJob.run().catch(() => 'ignore')
  }

  async hasFinished(): Promise<void> {
    const promises: Promise<void>[] = []

    if (this.coordinatorJob) {
      promises.push(this.coordinatorJob.hasFinished())
    }

    await Promise.all(promises)
  }

  async stop(): Promise<void> {
    return this.coordinatorJob && this.coordinatorJob.stop()
  }

  /**
   * Add work to the pool
   * @param work The work payload to add
   * @throws QueueFullError if the queue is full
   */
  async addWork(work: PendingWork<T> | PendingWork<T>[]): Promise<void> {
    work = Array.isArray(work) ? work : [work]
    if (!work.length) return

    if (this.options.maxQueueSize) {
      const count = await this.getCount()
      if (count + work.length > this.options.maxQueueSize)
        throw new QueueFullError(this)
    }

    await this.options.dal.save(work)

    console.log(`PendingWork | Added ${work.length} items [${this.options.id}]`)

    this.skipNextSleep()
  }

  async removeWork(work: PendingWork<T> | PendingWork<T>[]): Promise<void> {
    work = Array.isArray(work) ? work : [work]
    if (!work.length) return

    await this.options.dal.remove(work)

    console.log(
      `PendingWork | Removed ${work.length} items [${this.options.id}]`,
    )
  }

  async getCount(): Promise<number> {
    return this.options.dal.getCount()
  }

  async getFirstValue(): Promise<PendingWork<T> | undefined> {
    return this.options.dal.getFirstValue()
  }

  async get(signature: string): Promise<PendingWork<T> | undefined> {
    return this.options.dal.get(signature)
  }

  skipNextSleep(): void {
    this.skipSleep = true
    this.debouncedJob && this.debouncedJob.run().catch(() => 'ignore')
  }

  protected async runJob(): Promise<number> {
    const { concurrency, chunkSize } = this.options

    const generator = await this.getPendingWork(chunkSize)
    const minSleepTimeRef = await concurrentPromises(generator, concurrency)

    const sleep = this.skipSleep
      ? 0
      : minSleepTimeRef.value === MAX_TIMER_INTEGER
      ? this.debouncedJob
        ? undefined
        : this.options.interval
      : minSleepTimeRef.value

    this.skipSleep = false

    return sleep
  }

  protected async getPendingWork(
    chunkSize = 1,
  ): Promise<Generator<Promise<void>>> {
    const pendingWorkStream = await this.options.dal
      .useIndex(PendingWorkDALIndex.Sorted)
      .getAll({ reverse: false })

    const pendingWorkGen = pendingWorkStream[
      Symbol.asyncIterator
    ]() as AsyncIterator<StorageEntry<string, PendingWork<T>>>

    const mutex = new Mutex()
    const minSleepTimeRef = { value: MAX_TIMER_INTEGER }
    let exit = false

    return function* (this: PendingWorkPool<T>) {
      while (!exit) {
        yield (async () => {
          const release = await mutex.acquire()
          let works: PendingWork<T>[] = []

          try {
            if (exit) return
            works = await this.loadPendingWork(pendingWorkGen, chunkSize)
            exit = works.length < chunkSize
            if (works.length === 0) return
          } finally {
            release()
          }

          if (this.options.preCheckComplete) {
            works = await this.checkComplete(works)
            if (works.length === 0) return
          }

          console.log(
            `PendingWork | Handling ${works.length} items [${this.options.id}]`,
          )

          let sleepTime

          try {
            sleepTime = await this.handleWork(works)

            if (sleepTime !== undefined) {
              minSleepTimeRef.value = Math.min(minSleepTimeRef.value, sleepTime)
            }
          } finally {
            // @note: Always check complete works, for not repeating them all in case that only one failed
            await this.checkComplete(works)
          }
        })()
      }

      return minSleepTimeRef
    }.call(this)
  }

  protected async loadPendingWork(
    pendingWorkGen: AsyncIterator<StorageEntry<string, PendingWork<T>>>,
    size: number,
  ): Promise<PendingWork<T>[]> {
    const result: PendingWork<T>[] = []

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const next = await pendingWorkGen.next()

      if (next.value) {
        const { value: work } = next.value
        result.push(work)
      }

      // @note: We are taking the assumption here that the provided entities are
      // already deduped before being stored by using a custom index for doing the query

      if (next.done || result.length >= size) return result
    }
  }

  protected async handleWork(works: PendingWork<T>[]): Promise<number | void> {
    return this.options.handleWork(works)
  }

  protected async checkComplete(
    works: PendingWork<T>[],
  ): Promise<PendingWork<T>[]> {
    const worksToDelete: PendingWork<T>[] = []
    const pendingWorks: PendingWork<T>[] = []

    await Promise.all(
      works.map(async (work) => {
        const complete = (await this.options.checkComplete?.(work)) || false
        if (complete) {
          worksToDelete.push(work)
        } else {
          pendingWorks.push(work)
        }
      }),
    )

    await this.options.dal.remove(worksToDelete)

    console.log(
      `PendingWork | Deleted ${worksToDelete.length} of ${works.length} items [${this.options.id}]`,
    )

    return pendingWorks
  }
}
