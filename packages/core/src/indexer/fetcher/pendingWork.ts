import { MAX_TIMER_INTEGER } from '../../constants.js'
import { concurrentPromises, JobRunner, Mutex } from '../../utils/index.js'
import { StorageEntry } from '../../storage/index.js'
import { PendingWork } from './types.js'
import {
  PendingWorkDAL,
  PendingWorkDALIndex,
} from '../../storage/pendingWork.js'

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
  protected coordinatorJob!: JobRunner

  constructor(protected options: PendingWorkOptions<T>) {}

  async init(): Promise<void> {
    this.coordinatorJob = new JobRunner({
      name: `${this.options.id} 🔄`,
      interval: this.options.interval,
      intervalFn: this.runJob.bind(this),
    })
  }

  async run(): Promise<unknown> {
    const promises: Promise<void>[] = []

    if (this.coordinatorJob) {
      promises.push(this.coordinatorJob.hasFinished())
      this.coordinatorJob.run()
    }

    await Promise.all(promises)

    return
  }

  async addWork(work: PendingWork<T> | PendingWork<T>[]): Promise<void> {
    await this.options.dal.save(work)
    this.skipNextSleep()
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
  }

  protected async runJob(): Promise<number> {
    const { concurrency, chunkSize } = this.options

    const generator = await this.getPendingWork(chunkSize)
    const minSleepTimeRef = await concurrentPromises(generator, concurrency)

    const sleep = this.skipSleep
      ? 0
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
            `Handling ${works.length} works from ${this.options.id} pending work queue`,
          )

          const sleepTime = await this.handleWork(works)

          if (sleepTime) {
            minSleepTimeRef.value = Math.min(minSleepTimeRef.value, sleepTime)
            return
          }

          await this.checkComplete(works)
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
    const { checkComplete } = this.options
    if (!checkComplete) return works

    const worksToDelete: PendingWork<T>[] = []
    const pendingWorks: PendingWork<T>[] = []

    await Promise.all(
      works.map(async (work) => {
        const complete = await checkComplete(work)
        if (complete) {
          worksToDelete.push(work)
        } else {
          pendingWorks.push(work)
        }
      }),
    )

    await this.options.dal.remove(worksToDelete)

    return pendingWorks
  }
}
