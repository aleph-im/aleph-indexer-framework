import { Utils } from '../../index.js'
import { FetcherStateLevelStorage } from '../../storage/fetcherState.js'
import { JobRunnerReturnCode } from '../../utils/concurrence/index.js'
import {
  BaseFetcherJobRunnerOptions,
  BaseFetcherJobState,
  BaseFetcherOptions,
  BaseFetcherPaginationCursors,
  BaseFetcherState,
  FetcherJobRunnerUpdateCursorResult,
} from './types.js'

/**
 * Fetcher abstract class that provides methods to init and stop the fetching
 * process, also to save and load the work in progress.
 */
export class BaseFetcher<C> {
  protected fetcherState!: BaseFetcherState<C>
  protected forwardJob: Utils.JobRunner | undefined
  protected backwardJob: Utils.JobRunner | undefined

  /**
   * @param options Fetcher options.
   * @param fetcherStateDAL Fetcher state storage.
   */
  constructor(
    protected options: BaseFetcherOptions<C>,
    protected fetcherStateDAL: FetcherStateLevelStorage<C>,
  ) {}

  getId(): string {
    return this.options.id
  }

  async init(): Promise<void> {
    await this.loadFetcherState()

    if (this.options.jobs?.backward) {
      const { frequency: intervalInit, complete } =
        this.fetcherState.jobs?.backward || {}

      if (!complete) {
        this.backwardJob = new Utils.JobRunner({
          ...this.options.jobs?.backward,
          name: `${this.options.id} ⏪`,
          intervalInit,
          intervalFn: this._runJob.bind(this, 'backward'),
        })
      }
    }

    if (this.options.jobs?.forward) {
      const { frequency: intervalInit, complete } =
        this.fetcherState.jobs?.forward || {}

      if (!complete) {
        this.forwardJob = new Utils.JobRunner({
          ...this.options.jobs?.forward,
          name: `${this.options.id} ⏩`,
          intervalInit,
          intervalFn: this._runJob.bind(this, 'forward'),
        })

        this.forwardJob.on('firstRun', () => {
          if (this.backwardJob) this.backwardJob.run()
        })
      }
    }
  }

  async run(): Promise<unknown> {
    const promises: Promise<void>[] = []

    if (this.forwardJob) {
      promises.push(this.forwardJob.hasFinished())
      this.forwardJob.run()
    } else {
      console.log(`skipping forward job for ${this.options.id}`)
    }

    if (this.backwardJob) {
      promises.push(this.backwardJob.hasFinished())
      if (!this.forwardJob) this.backwardJob.run()
    } else {
      console.log(`skipping backward job for ${this.options.id}`)
    }

    await Promise.all(promises)

    return
  }

  async stop(): Promise<void> {
    await this.forwardJob?.stop()
    await this.backwardJob?.stop()
  }

  async complete(fetcherType: 'forward' | 'backward'): Promise<void> {
    const job = fetcherType === 'backward' ? this.backwardJob : this.forwardJob
    job?.stop()

    this.fetcherState.jobs[fetcherType].complete = true
    await this.saveFetcherState()
  }

  isComplete(fetcherType?: 'forward' | 'backward'): boolean {
    return fetcherType
      ? this.fetcherState.jobs[fetcherType].complete
      : this.fetcherState.jobs.forward.complete &&
          this.fetcherState.jobs.backward.complete
  }

  getLastRun(fetcherType?: 'forward' | 'backward'): number {
    return fetcherType
      ? this.fetcherState.jobs[fetcherType].lastRun
      : Math.max(
          this.fetcherState.jobs.forward.lastRun,
          this.fetcherState.jobs.backward.lastRun,
        )
  }

  getNextRun(fetcherType?: 'forward' | 'backward'): number {
    if (fetcherType) {
      return this.isComplete(fetcherType)
        ? Number.POSITIVE_INFINITY
        : this.getLastRun(fetcherType) +
            (this.fetcherState.jobs[fetcherType].frequency ||
              this.options.jobs?.[fetcherType]?.interval ||
              0)
    }

    return Math.min(
      this.isComplete('forward')
        ? Number.POSITIVE_INFINITY
        : this.getLastRun('forward') +
            (this.fetcherState.jobs['forward'].frequency ||
              this.options.jobs?.['forward']?.interval ||
              0),
      this.isComplete('backward')
        ? Number.POSITIVE_INFINITY
        : this.getLastRun('backward') +
            (this.fetcherState.jobs['backward'].frequency ||
              this.options.jobs?.['backward']?.interval ||
              0),
    )
  }

  getPendingRuns(fetcherType?: 'forward' | 'backward'): number {
    if (fetcherType) {
      return (
        (fetcherType === 'forward'
          ? this.options.jobs?.forward
          : this.options.jobs?.backward
        )?.times || Number.POSITIVE_INFINITY
      )
    }

    return Math.max(
      this.options.jobs?.forward?.times || Number.POSITIVE_INFINITY,
      this.options.jobs?.backward?.times || Number.POSITIVE_INFINITY,
    )
  }

  /**
   * Initialises the fetcherState class property of the Fetcher instance, could get
   * the data from the data access layer when the fetching progress is restarted.
   */
  protected async loadFetcherState(): Promise<void> {
    if (this.fetcherState) return

    const id = this.options.id
    this.fetcherState = (await this.fetcherStateDAL.get(id)) || {
      id,
      cursors: undefined,
      jobs: {
        forward: {
          frequency: this.options.jobs?.forward?.intervalInit,
          lastRun: 0,
          numRuns: 0,
          complete: false,
          useHistoricRPC: false,
        },
        backward: {
          frequency: this.options.jobs?.backward?.intervalInit,
          lastRun: 0,
          numRuns: 0,
          complete: false,
          useHistoricRPC: false,
        },
      },
    }
  }

  /**
   * Saves the fetcher state in the data access layer.
   */
  protected async saveFetcherState(): Promise<void> {
    if (!this.fetcherState) return
    return this.fetcherStateDAL.save(this.fetcherState)
  }

  protected async _runJob(
    fetcherType: 'forward' | 'backward',
    ctx: {
      firstRun: boolean
      interval: number
    },
  ): Promise<number> {
    const opts = (
      fetcherType === 'backward'
        ? this.options.jobs?.backward
        : this.options.jobs?.forward
    ) as BaseFetcherJobRunnerOptions<C>

    const jobState = this.fetcherState.jobs[fetcherType]

    if (jobState.complete) return JobRunnerReturnCode.Stop
    jobState.lastRun = Date.now()

    const {
      error,
      lastCursors: lastCursor,
      newInterval = ctx.interval,
    } = await opts.handleFetch(ctx)

    let newTxs = false

    // @note: Update pagination cursor
    // @note: Do not update forward job if there is an error
    if (fetcherType === 'backward' || !error) {
      const updateFn =
        opts.updateCursors || this._updateCursors.bind(this, fetcherType)

      const result = await updateFn({
        prevCursors: this.fetcherState.cursors,
        lastCursors: lastCursor,
      })

      newTxs = newTxs || result.newItems
      this.fetcherState.cursors = result.newCursors
      jobState.numRuns++
    }

    // @note: Update new frequency
    if (newInterval && newInterval > 0 && jobState.frequency !== undefined) {
      const intervalMax = this.options.jobs?.forward?.intervalMax || newInterval
      jobState.frequency = Math.min(newInterval, intervalMax)
    }

    const checkCompleteFn =
      opts.checkComplete || this._checkComplete.bind(this, fetcherType)

    jobState.complete = await checkCompleteFn({
      fetcherState: this.fetcherState,
      jobState,
      newItems: newTxs,
      error,
    })

    // @note: Check for swap RPC or complete
    let swapToPublicRPC = false

    if (fetcherType === 'backward' && !error && !newTxs) {
      swapToPublicRPC = !jobState.useHistoricRPC

      if (swapToPublicRPC) {
        // @note: Swap to public RPC
        jobState.useHistoricRPC = true
      }
    }

    await this.saveFetcherState()

    // @note: Restart job after saving lastKeys in jobState
    if (error) throw error

    if (jobState.complete) return JobRunnerReturnCode.Stop

    if (swapToPublicRPC) {
      return this._runJob(fetcherType, {
        firstRun: ctx.firstRun,
        interval: newInterval,
      })
    }

    return newInterval
  }

  protected async _updateCursors(
    type: 'forward' | 'backward',
    ctx: {
      prevCursors?: BaseFetcherPaginationCursors<C>
      lastCursors: BaseFetcherPaginationCursors<C>
    },
  ): Promise<FetcherJobRunnerUpdateCursorResult<C>> {
    let newItems = false
    const { prevCursors, lastCursors } = ctx
    const newCursors: BaseFetcherPaginationCursors<C> = { ...prevCursors }

    switch (type) {
      case 'backward': {
        if (lastCursors.backward) {
          newCursors.backward = lastCursors.backward
          newItems = true
        }

        if (!prevCursors?.forward) {
          newCursors.forward = lastCursors.forward
        }

        break
      }
      case 'forward': {
        if (lastCursors.forward) {
          newCursors.forward = lastCursors.forward
          newItems = true
        }

        if (!prevCursors?.backward) {
          newCursors.backward = lastCursors.backward
        }

        break
      }
    }

    return { newCursors, newItems }
  }

  protected async _checkComplete(
    type: 'forward' | 'backward',
    ctx: {
      jobState: BaseFetcherJobState
      newItems: boolean
      error?: Error
    },
  ): Promise<boolean> {
    const { jobState, newItems, error } = ctx
    return !error && type === 'backward' && !newItems && jobState.useHistoricRPC
  }
}
