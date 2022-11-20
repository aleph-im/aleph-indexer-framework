import { Duration } from 'luxon'
import { MAX_TIMER_INTEGER } from '../../constants.js'
import { BaseFetcher } from '../base/baseFetcher.js'
import {
  PendingWork,
  PendingWorkOptions,
  PendingWorkPool,
} from '../../utils/concurrence/pendingWork.js'
import { PendingWorkDAL } from '../../storage/pendingWork.js'

export interface FetcherPoolOptions<T>
  extends Omit<
    PendingWorkOptions<T>,
    'checkComplete' | 'handleWork' | 'chunkSize'
  > {
  dal: PendingWorkDAL<T>
  getFetcher: (
    work: PendingWork<T>,
  ) => Promise<BaseFetcher<any>> | BaseFetcher<any>
  checkComplete?: (
    work: PendingWork<T>,
    fetcher?: BaseFetcher<any>,
  ) => Promise<boolean> | boolean
}

export class FetcherPool<T> extends PendingWorkPool<T> {
  protected workFetcher: Record<string, BaseFetcher<any>> = {}
  protected options!: FetcherPoolOptions<T> & PendingWorkOptions<T>

  constructor(options: FetcherPoolOptions<T>) {
    super({
      checkComplete: async (work: PendingWork<T>): Promise<boolean> => {
        const checkCompleteFn = this.options.checkComplete
          ? this.options.checkComplete
          : this.defaultCheckComplete

        const fetcher = await this.getFetcher(work)
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

        const sleepTime = Math.max(
          Math.min(fetcher.getNextRun() - Date.now(), MAX_TIMER_INTEGER),
          0,
        )

        if (sleepTime > 0) {
          console.log(
            `[${fetcher.getId()}] indexer running again in ${
              Duration.fromMillis(sleepTime).toISOTime() || '+24h'
            }`,
          )

          return sleepTime
        }

        await fetcher.run()
      },
      preCheckComplete: true,
      chunkSize: 1,
      ...options,
    })
  }

  protected async getFetcher(work: PendingWork<T>): Promise<BaseFetcher<any>> {
    let fetcher = this.workFetcher[work.id]

    if (!fetcher) {
      fetcher = await this.options.getFetcher(work)
      this.workFetcher[work.id] = fetcher
    }

    return fetcher
  }

  protected defaultCheckComplete(
    work: PendingWork<T>,
    fetcher?: BaseFetcher<any>,
  ): boolean {
    if (fetcher) {
      return fetcher.isComplete()
    }

    return false
  }
}
