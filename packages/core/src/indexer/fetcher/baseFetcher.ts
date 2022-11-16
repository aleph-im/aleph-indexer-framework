import { Utils } from '../../index.js'
import { FetcherStateLevelStorage } from '../../storage/fetcherState.js'
import { JobRunnerReturnCode } from '../../utils/concurrence/index.js'
import { FetcherJobRunnerOptions, FetcherStateV1 } from './types.js'

export interface FetcherOptions {
  id: string
  forwardJobOptions?: FetcherJobRunnerOptions
  backwardJobOptions?: FetcherJobRunnerOptions
}

/**
 * Fetcher abstract class that provides methods to init and stop the fetching
 * process, also to save and load the work in progress.
 */
export abstract class Fetcher {
  protected fetcherState!: FetcherStateV1
  protected forwardJob: Utils.JobRunner | undefined
  protected backwardJob: Utils.JobRunner | undefined

  /**
   * @param options Fetcher options.
   * @param fetcherStateDAL Fetcher state storage.
   */
  constructor(
    protected options: FetcherOptions,
    protected fetcherStateDAL: FetcherStateLevelStorage,
  ) {}

  getId(): string {
    return this.options.id
  }

  async init(): Promise<void> {
    await this.loadFetcherState()

    if (this.options.backwardJobOptions) {
      const { frequency: intervalInit, complete } = this.fetcherState.backward

      if (!complete) {
        this.backwardJob = new Utils.JobRunner({
          ...this.options.backwardJobOptions,
          name: `${this.options.id} ⏪`,
          intervalInit,
          intervalFn: this._runJob.bind(this, 'backward'),
        })
      }
    }

    if (this.options.forwardJobOptions) {
      const { frequency: intervalInit, complete } = this.fetcherState.forward

      if (!complete) {
        this.forwardJob = new Utils.JobRunner({
          ...this.options.forwardJobOptions,
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
          ? this.options.forwardJobOptions
          : this.options.backwardJobOptions
        )?.times || Number.POSITIVE_INFINITY
      )
    }

    return Math.max(
      this.options.forwardJobOptions?.times || Number.POSITIVE_INFINITY,
      this.options.backwardJobOptions?.times || Number.POSITIVE_INFINITY,
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
      forward: {
        frequency: this.options.forwardJobOptions?.intervalInit || 0,
        lastRun: 0,
        numRuns: 0,
        complete: false,
        usePublicRPC: false,
      },
      backward: {
        frequency: this.options.backwardJobOptions?.intervalInit || 0,
        lastRun: 0,
        numRuns: 0,
        complete: false,
        usePublicRPC: false,
      },
      addresses: {},
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
        ? this.options.backwardJobOptions
        : this.options.forwardJobOptions
    ) as FetcherJobRunnerOptions

    const jobState = this.fetcherState[fetcherType]

    if (jobState.complete) return JobRunnerReturnCode.Stop
    jobState.lastRun = Date.now()

    const { error, newInterval, lastFetchedKeys } = await opts.intervalFn(ctx)

    let newTxs = false

    // @note: Update firstKey & lastKey
    for (const [address, addressKeys] of Object.entries(lastFetchedKeys)) {
      const state = (this.fetcherState.addresses[address] =
        this.fetcherState.addresses[address] || {})

      if (fetcherType === 'backward') {
        if (addressKeys.firstSignature) {
          state.firstSignature = addressKeys.firstSignature
          state.firstSlot = addressKeys.firstSlot
          state.firstTimestamp = addressKeys.firstTimestamp
          newTxs = true
        }

        if (!state.lastSignature) {
          state.lastSignature = addressKeys.lastSignature
          state.lastSlot = addressKeys.lastSlot
          state.lastTimestamp = addressKeys.lastTimestamp
        }

        jobState.numRuns++
      }
      // @note: Do not update forward job if there is an error
      else if (!error) {
        if (addressKeys.lastSignature) {
          state.lastSignature = addressKeys.lastSignature
          state.lastSlot = addressKeys.lastSlot
          state.lastTimestamp = addressKeys.lastTimestamp
          newTxs = true
        }

        if (!state.firstSignature) {
          state.firstSignature = addressKeys.firstSignature
          state.firstSlot = addressKeys.firstSlot
          state.firstTimestamp = addressKeys.firstTimestamp
        }

        jobState.numRuns++
      }
    }

    // @note: Update new frequency
    if (newInterval > 0) {
      const intervalMax =
        this.options.forwardJobOptions?.intervalMax || newInterval

      jobState.frequency = Math.min(newInterval, intervalMax)
    }

    // @note: Check for swap RPC or complete
    let swapToPublicRPC = false

    if (!error) {
      if (fetcherType === 'backward' && !newTxs) {
        swapToPublicRPC = !jobState.usePublicRPC

        if (swapToPublicRPC) {
          // @note: Swap to public RPC
          jobState.usePublicRPC = true
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
