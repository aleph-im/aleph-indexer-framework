import { Utils } from '@aleph-indexer/core'
import { FetcherStateLevelStorage } from './dal/fetcherState.js'
import {
  BaseFetcherJobRunnerOptions,
  BaseFetcherJobState,
  BaseFetcherOptions,
  BaseFetcherPaginationCursors,
  BaseFetcherState,
  FetcherJobRunnerUpdateCursorResult,
} from './types.js'
import { Mutex } from '@aleph-indexer/core/dist/utils/index.js'

/**
 * Fetcher abstract class that provides methods to init and stop the fetching
 * process, also to save and load the work in progress.
 */
export class BaseHistoryFetcher<C> {
  protected fetcherState!: BaseFetcherState<C>
  protected forwardJob: Utils.JobRunner | undefined
  protected backwardJob: Utils.JobRunner | undefined
  protected fetcherStateMutex = new Mutex()

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
    const fetcherState = await this.getFetcherState()

    if (!this.backwardJob && this.options.jobs?.backward) {
      const { frequency: intervalInit, complete } =
        fetcherState.jobs?.backward || {}

      if (!complete) {
        this.backwardJob = new Utils.JobRunner({
          ...this.options.jobs?.backward,
          name: `${this.options.id} ⏪`,
          intervalInit,
          intervalFn: this._runJob.bind(this, 'backward'),
        })
      }
    }

    if (!this.forwardJob && this.options.jobs?.forward) {
      const { frequency: intervalInit, complete } =
        fetcherState.jobs?.forward || {}

      if (!complete) {
        this.forwardJob = new Utils.JobRunner({
          ...this.options.jobs?.forward,
          name: `${this.options.id} ⏩`,
          intervalInit,
          intervalFn: this._runJob.bind(this, 'forward'),
        })

        this.forwardJob.on('firstRun', () => {
          this.runBackwardJob(true).catch(() => 'ignore')
        })
      }
    }
  }

  async run(): Promise<unknown> {
    return Promise.all([this.runBackwardJob(false), this.runForwardJob()])
  }

  protected async runBackwardJob(
    isRunAfterForwardJobFirstRun: boolean,
  ): Promise<void> {
    const skipMessage = `skipping backward job for ${this.options.id}`

    if (!this.backwardJob) {
      console.log(skipMessage)
      return
    }

    const fetcherState = await this.getFetcherState()
    const { complete: backwardComplete } = fetcherState.jobs?.backward || {}
    if (backwardComplete) {
      console.log(skipMessage)
      return
    }

    if (!isRunAfterForwardJobFirstRun && this.forwardJob) {
      const { complete: forwardComplete } = fetcherState.jobs?.forward || {}

      if (!forwardComplete) {
        await this.backwardJob.hasFinished()
        return
      }
    }

    await this.backwardJob.run()
  }

  protected async runForwardJob(): Promise<void> {
    const skipMessage = `skipping forward job for ${this.options.id}`

    if (!this.forwardJob) {
      console.log(skipMessage)
      return
    }

    const fetcherState = await this.getFetcherState()
    const { complete: forwardComplete } = fetcherState.jobs?.forward || {}
    if (forwardComplete) {
      console.log(skipMessage)
      return
    }

    await this.forwardJob.run()
  }

  async stop(): Promise<void> {
    await this.forwardJob?.stop()
    await this.backwardJob?.stop()
  }

  async getState(): Promise<BaseFetcherState<C>> {
    await this.getFetcherState()
    return this.fetcherState
  }

  async complete(fetcherType: 'forward' | 'backward'): Promise<void> {
    const fetcherState = await this.getFetcherState()

    const job = fetcherType === 'backward' ? this.backwardJob : this.forwardJob
    job?.stop()

    fetcherState.jobs[fetcherType].complete = true
    await this.saveFetcherState()
  }

  async isComplete(fetcherType?: 'forward' | 'backward'): Promise<boolean> {
    if (fetcherType) {
      const fetcherState = await this.getFetcherState()

      const fetcherOptions = this.options.jobs?.[fetcherType]
      if (!fetcherOptions) return true

      return fetcherState.jobs[fetcherType].complete
    }

    const forwardComplete = await this.isComplete('forward')
    const backwardComplete = await this.isComplete('backward')

    return forwardComplete && backwardComplete
  }

  async getLastRun(fetcherType?: 'forward' | 'backward'): Promise<number> {
    if (fetcherType) {
      const fetcherOptions = this.options.jobs?.[fetcherType]
      if (!fetcherOptions) return 0

      const fetcherState = await this.getFetcherState()
      return fetcherState.jobs[fetcherType].lastRun
    }

    const forwardLastRun = await this.getLastRun('forward')
    const backwardLastRun = await this.getLastRun('backward')

    return Math.max(forwardLastRun, backwardLastRun)
  }

  async getNextRun(fetcherType?: 'forward' | 'backward'): Promise<number> {
    if (fetcherType) {
      const fetcherState = await this.getFetcherState()

      return (await this.isComplete(fetcherType))
        ? Number.POSITIVE_INFINITY
        : (await this.getLastRun(fetcherType)) +
            (fetcherState.jobs[fetcherType].frequency ||
              this.options.jobs?.[fetcherType]?.interval ||
              0)
    }

    return Math.min(
      await this.getNextRun('forward'),
      await this.getNextRun('backward'),
    )
  }

  async getPendingRuns(fetcherType?: 'forward' | 'backward'): Promise<number> {
    if (fetcherType) {
      const fetcher =
        fetcherType === 'forward'
          ? this.options.jobs?.forward
          : this.options.jobs?.backward

      if (!fetcher) return 0
      return fetcher?.times || Number.POSITIVE_INFINITY
    }

    return Math.max(
      await this.getPendingRuns('forward'),
      await this.getPendingRuns('backward'),
    )
  }

  /**
   * Initialises the fetcherState class property of the Fetcher instance, could get
   * the data from the data access layer when the fetching progress is restarted.
   */
  protected async getFetcherState(
    useHistoricRPC = true,
  ): Promise<BaseFetcherState<C>> {
    const release = await this.fetcherStateMutex.acquire()

    try {
      if (this.fetcherState) return this.fetcherState

      const id = this.options.id
      this.fetcherState = (await this.fetcherStateDAL.get(id)) || {
        id,
        cursors: undefined,
        jobs: {
          forward: {
            frequency: undefined,
            lastRun: 0,
            numRuns: 0,
            complete: false,
            useHistoricRPC,
          },
          backward: {
            frequency: undefined,
            lastRun: 0,
            numRuns: 0,
            complete: false,
            useHistoricRPC,
          },
        },
      }

      this.initJobsFrequencyState('forward')
      this.initJobsFrequencyState('backward')

      return this.fetcherState
    } finally {
      release()
    }
  }

  protected initJobsFrequencyState(jobType: 'forward' | 'backward'): void {
    const job = this.fetcherState.jobs[jobType]

    // @note: Only activate frequency states if "intervalInit" job config was provided
    const jobIntervalInit = this.options.jobs?.[jobType]?.intervalInit

    job.frequency =
      jobIntervalInit === undefined
        ? undefined
        : job.frequency !== undefined
        ? job.frequency
        : jobIntervalInit
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

    const fetcherState = await this.getFetcherState()

    const jobState = fetcherState.jobs[fetcherType]

    if (jobState.complete) return Utils.JobRunnerReturnCode.Stop
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
        prevCursors: fetcherState.cursors,
        lastCursors: lastCursor,
      })

      newTxs = newTxs || result.newItems
      fetcherState.cursors = result.newCursors
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
      fetcherState,
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

    if (jobState.complete) return Utils.JobRunnerReturnCode.Stop

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
