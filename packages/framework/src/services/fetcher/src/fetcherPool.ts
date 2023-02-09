import { Duration } from 'luxon'
import {
  PendingWork,
  PendingWorkOptions,
  PendingWorkPool,
  PendingWorkDAL,
  Utils,
} from '@aleph-indexer/core'
import { BaseHistoryFetcher } from './baseHistoryFetcher.js'

const { MAX_TIMER_INTEGER } = Utils

export interface FetcherPoolOptions<T>
  extends Omit<
    PendingWorkOptions<T>,
    'checkComplete' | 'handleWork' | 'chunkSize'
  > {
  dal: PendingWorkDAL<T>
  fetcherCache?: boolean
  getFetcher: (
    work: PendingWork<T>,
  ) => Promise<BaseHistoryFetcher<any>> | BaseHistoryFetcher<any>
  checkComplete?: (
    work: PendingWork<T>,
    fetcher?: BaseHistoryFetcher<any>,
  ) => Promise<boolean> | boolean
}

export class FetcherPool<T> extends PendingWorkPool<T> {
  protected workFetcher: Record<string, BaseHistoryFetcher<any>> = {}
  protected options!: FetcherPoolOptions<T> & PendingWorkOptions<T>

  constructor(options: FetcherPoolOptions<T>) {
    const { checkComplete, ...rest } = options

    super({
      checkComplete: async (work: PendingWork<T>): Promise<boolean> => {
        const fetcher = await this.getFetcher(work)
        await fetcher.init()

        const checkCompleteFn = checkComplete
          ? checkComplete
          : this.defaultCheckComplete

        const complete = await checkCompleteFn(work, fetcher)
        if (!complete) return false

        await this.options.dal.remove(work)
        console.log(`Account tracker for ${work.id} complete!`)

        return true
      },
      handleWork: async (works: PendingWork<T>[]): Promise<number | void> => {
        // @note: chunkSize is fixed to 1
        const [work] = works
        const fetcher = await this.getFetcher(work)

        const pendingRuns = await fetcher.getPendingRuns()

        if (pendingRuns !== 1)
          throw new Error(
            'Fetcher should be configured for doing a single run to be used by the fetcherPool',
          )

        await fetcher.init()

        const sleepTime = await this.getSleepTime(fetcher)
        if (sleepTime) return sleepTime

        await fetcher.run()

        return (await this.getSleepTime(fetcher)) || 1
      },
      preCheckComplete: true,
      chunkSize: 1,
      ...rest,
    })
  }

  protected async getSleepTime(
    fetcher: BaseHistoryFetcher<any>,
  ): Promise<number> {
    const nextRun = await fetcher.getNextRun()

    const sleepTime = Math.max(
      Math.min(nextRun - Date.now(), MAX_TIMER_INTEGER),
      0,
    )

    if (sleepTime) {
      console.log(
        `[${fetcher.getId()}] fetcher running again in ${
          Duration.fromMillis(sleepTime).toISOTime() || '+24h'
        }`,
      )
    }

    return sleepTime
  }

  protected async getFetcher(
    work: PendingWork<T>,
  ): Promise<BaseHistoryFetcher<any>> {
    if (!this.options.fetcherCache) {
      return this.options.getFetcher(work)
    }

    let fetcher = this.workFetcher[work.id]

    if (!fetcher) {
      fetcher = await this.options.getFetcher(work)
      this.workFetcher[work.id] = fetcher
    }

    return fetcher
  }

  protected async defaultCheckComplete(
    work: PendingWork<T>,
    fetcher?: BaseHistoryFetcher<any>,
  ): Promise<boolean> {
    if (fetcher) return await fetcher.isComplete()
    return false
  }
}
