import { Utils } from '../../index.js'
import { FetcherStateLevelStorage } from '../../storage/fetcherState.js'
import { JobRunnerReturnCode } from '../../utils/concurrence/index.js'
import {
  BaseFetcherJobRunnerOptions,
  BaseFetcherOptions,
  BaseFetcherState,
} from './types.js'

export class BaseFetcher<C> {
  protected fetcherState!: BaseFetcherState<C>
  protected forwardJob: Utils.JobRunner | undefined
  protected backwardJob: Utils.JobRunner | undefined

  constructor(
    protected options: BaseFetcherOptions<C>,
    protected fetcherStateDAL: FetcherStateLevelStorage<C>,
  ) {}

  getId(): string {
    return this.options.id
  }

  async init(): Promise<void> {
    await this.loadFetcherState()

    if (this.options.backward) {
      const { frequency: intervalInit, complete } = this.fetcherState.backward

      if (!complete) {
        this.backwardJob = new Utils.JobRunner({
          ...this.options.backward,
          name: `${this.options.id} ⏪`,
          intervalInit,
          intervalFn: this._runJob.bind(this, 'backward'),
        })
      }
    }

    if (this.options.forward) {
      const { frequency: intervalInit, complete } = this.fetcherState.forward

      if (!complete) {
        this.forwardJob = new Utils.JobRunner({
          ...this.options.forward,
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

    this.fetcherState[fetcherType].complete = true
    await this.saveFetcherState()
  }

  isComplete(fetcherType?: 'forward' | 'backward'): boolean {
    return fetcherType
      ? this.fetcherState[fetcherType].complete
      : this.fetcherState.forward.complete &&
          this.fetcherState.backward.complete
  }

  getLastRun(fetcherType?: 'forward' | 'backward'): number {
    return fetcherType
      ? this.fetcherState[fetcherType].lastRun
      : Math.max(
          this.fetcherState.forward.lastRun,
          this.fetcherState.backward.lastRun,
        )
  }

  getNextRun(fetcherType?: 'forward' | 'backward'): number {
    if (fetcherType) {
      return this.isComplete(fetcherType)
        ? Number.POSITIVE_INFINITY
        : this.getLastRun(fetcherType) +
            this.fetcherState[fetcherType].frequency
    }

    return Math.min(
      this.isComplete('forward')
        ? Number.POSITIVE_INFINITY
        : this.getLastRun('forward') + this.fetcherState['forward'].frequency,
      this.isComplete('backward')
        ? Number.POSITIVE_INFINITY
        : this.getLastRun('backward') + this.fetcherState['backward'].frequency,
    )
  }

  getPendingRuns(fetcherType?: 'forward' | 'backward'): number {
    if (fetcherType) {
      return (
        (fetcherType === 'forward'
          ? this.options.forward
          : this.options.backward
        )?.times || Number.POSITIVE_INFINITY
      )
    }

    return Math.max(
      this.options.forward?.times || Number.POSITIVE_INFINITY,
      this.options.backward?.times || Number.POSITIVE_INFINITY,
    )
  }

  protected async loadFetcherState(): Promise<void> {
    if (this.fetcherState) return

    const id = this.options.id
    this.fetcherState = (await this.fetcherStateDAL.get(id)) || {
      id,
      cursor: undefined,
      forward: {
        frequency: this.options.forward?.intervalInit || 0,
        lastRun: 0,
        numRuns: 0,
        complete: false,
        useHistoricRPC: false,
      },
      backward: {
        frequency: this.options.backward?.intervalInit || 0,
        lastRun: 0,
        numRuns: 0,
        complete: false,
        useHistoricRPC: false,
      },
    }
  }

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
      fetcherType === 'backward' ? this.options.backward : this.options.forward
    ) as BaseFetcherJobRunnerOptions<C>

    const jobState = this.fetcherState[fetcherType]

    if (jobState.complete) return JobRunnerReturnCode.Stop
    jobState.lastRun = Date.now()

    const {
      error,
      lastCursor,
      newInterval = ctx.interval,
    } = await opts.handleFetch(ctx)

    let newTxs = false

    // @note: Update pagination cursor
    // @note: Do not update forward job if there is an error
    if (fetcherType === 'backward' || !error) {
      const result = await opts.updateCursor({
        type: fetcherType,
        prevCursor: this.fetcherState.cursor,
        lastCursor,
      })

      newTxs = newTxs || result.newItems
      this.fetcherState.cursor = result.newCursor
      jobState.numRuns++
    }

    // @note: Update new frequency
    if (newInterval && newInterval > 0) {
      const intervalMax = this.options.forward?.intervalMax || newInterval

      jobState.frequency = Math.min(newInterval, intervalMax)
    }

    // @note: Check for swap RPC or complete
    let swapToPublicRPC = false

    if (!error) {
      if (fetcherType === 'backward' && !newTxs) {
        swapToPublicRPC = !jobState.useHistoricRPC

        if (swapToPublicRPC) {
          // @note: Swap to public RPC
          jobState.useHistoricRPC = true
        } else {
          // @note: Mark as complete
          jobState.complete = true
        }
      }
    }

    await this.saveFetcherState()

    // @note: Restart job after saving lastKeys in jobState
    if (error) throw error

    if (swapToPublicRPC) {
      return this._runJob(fetcherType, {
        firstRun: ctx.firstRun,
        interval: newInterval,
      })
    }

    return newInterval
  }
}
