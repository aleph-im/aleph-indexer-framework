import { Duration } from 'luxon'
import { MAX_TIMER_INTEGER } from '../../constants.js'
import { BaseHistoryFetcher } from '../base/baseFetcher.js'
import {
  PendingWork,
  PendingWorkOptions,
  PendingWorkPool,
} from '../../utils/concurrence/pendingWork.js'
import { PendingWorkDAL } from '../../utils/concurrence/dal/pendingWork.js'

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

        if (fetcher.getPendingRuns() !== 1)
          throw new Error(
            'Fetcher should be configured for doing a single run to be used by the fetcherPool',
          )

        await fetcher.init()

        const sleepTime = this.getSleepTime(fetcher)
        if (sleepTime) return sleepTime

        await fetcher.run()

        return this.getSleepTime(fetcher) || 1
      },
      preCheckComplete: true,
      chunkSize: 1,
      ...rest,
    })
  }

  protected getSleepTime(fetcher: BaseHistoryFetcher<any>): number {
    const sleepTime = Math.max(
      Math.min(fetcher.getNextRun() - Date.now(), MAX_TIMER_INTEGER),
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

  protected defaultCheckComplete(
    work: PendingWork<T>,
    fetcher?: BaseHistoryFetcher<any>,
  ): boolean {
    if (fetcher) return fetcher.isComplete()
    return false
  }
}
