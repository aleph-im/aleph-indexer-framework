import { StorageEntry } from '../../storage/index.js'
import { MAX_TIMER_INTEGER } from '../constants.js'
import { concurrentPromises, DebouncedJobRunner, Mutex } from './common.js'
import { PendingWorkDAL, PendingWorkDALIndex } from './dal/pendingWork.js'
import { JobRunner } from './jobRunner.js'

export * from './dal/pendingWork.js'

export type PendingWork<T> = {
  id: string
  time: number
  payload: T
}

export interface PendingWorkOptions<T> {
  id: string
  dal: PendingWorkDAL<T>
  interval: number
  concurrency: number
  chunkSize: number
  handleWork: (
    works: PendingWork<T>[],
  ) => Promise<number | void> | number | void
  checkComplete?: (work: PendingWork<T>) => Promise<boolean> | boolean
  preCheckComplete?: boolean
}

export class PendingWorkPool<T> {
  protected skipSleep = false
  protected debouncedJob: DebouncedJobRunner | undefined
  protected coordinatorJob: JobRunner | undefined

  constructor(protected options: PendingWorkOptions<T>) {
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

  async addWork(work: PendingWork<T> | PendingWork<T>[]): Promise<void> {
    work = Array.isArray(work) ? work : [work]
    if (!work.length) return

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
    return this.options.dal.getCount({ atomic: true })
  }

  async getFirstValue(): Promise<PendingWork<T> | undefined> {
    return this.options.dal.getFirstValue({ atomic: true })
  }

  async get(signature: string): Promise<PendingWork<T> | undefined> {
    return this.options.dal.get(signature, { atomic: true })
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
      ? 1
      : minSleepTimeRef.value === MAX_TIMER_INTEGER
      ? this.options.interval
      : minSleepTimeRef.value

    this.skipSleep = false

    return sleep
  }

  protected async getPendingWork(
    chunkSize = 1,
  ): Promise<Generator<Promise<void>>> {
    const pendingWorkStream = await this.options.dal
      .useIndex(PendingWorkDALIndex.Sorted)
      .getAll({ reverse: false, atomic: true })

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

            if (sleepTime) {
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
