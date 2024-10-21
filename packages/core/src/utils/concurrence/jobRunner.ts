import { EventEmitter } from 'events'
import { Duration } from 'luxon'
import { sleep } from '../time.js'
import { Future } from './common.js'

export enum JobRunnerReturnCode {
  Reset = -1,
  Stop = -2,
}

export interface JobRunnerOptions {
  name: string
  interval: number
  intervalFn: (ctx: {
    firstRun: boolean
    interval: number
  }) => Promise<number | void>
  times?: number
  intervalMax?: number
  intervalInit?: number
  intervalAccuracy?: boolean
  verbose?: boolean
  startAfter?: number
  jitter?: number
}

export type PartialJobRunnerOptions = Partial<JobRunnerOptions>

/**
 * Runs an `intervalFn` at a given `interval`. The `intervalFn` can return a
 * number to change the interval for the next run. `intervalMax` can be used to
 * limit the maximum interval time.
 *
 * The `intervalFn` can also return `JobRunnerReturnCode.Reset == -1` to reset
 * the interval to the initial value, or `JobRunnerReturnCode.Stop == -2` to
 * stop the runner.
 *
 * You can configure the `times` an interval is run, and also set a `jitter` to
 * randomize the interval. This is useful to avoid stampedes.
 *
 * Set `startAfter` to delay the first run. `intervalInit` can be used to set a
 * different interval for after the first run. `intervalAccuracy` can be used to
 * make sure the `intervalFn` is called at the exact interval time, otherwise
 * it will be called again after execution time + interval.
 */
export class JobRunner {
  private _events = new EventEmitter()
  private _isRunning = false
  private _finished = new Future<void>()

  protected options!: Required<JobRunnerOptions>

  constructor(options: JobRunnerOptions) {
    this.parseOptions(options)
  }

  /**
   * Registers an event handler. Possible events are:
   * - `beforeSleep`: Called before the runner sleeps until the next interval.
   * - `firstRun`: Called after the first run.
   * @param event
   * @param handler
   */
  on(
    event: 'beforeSleep' | 'firstRun',
    handler: (...args: any[]) => void | Promise<void>,
  ): this {
    this._events.on(event, handler)
    return this
  }

  log(...args: any[]): void {
    if (this.options.verbose) {
      console.info(...args)
    }
  }

  /**
   * Starts the runner.
   */
  async start(): Promise<void> {
    return this.run()
  }

  /**
   * The runner function. Returns a promise that resolves when the runner is
   * finished.
   */
  async run(options?: PartialJobRunnerOptions): Promise<void> {
    if (this._isRunning) return
    this._isRunning = true

    this.parseOptions(options)

    const {
      name,
      intervalFn,
      intervalAccuracy,
      interval: it,
      intervalMax,
      intervalInit,
      startAfter,
      times,
      jitter,
    } = this.options

    let interval = intervalInit
    let firstRun = true
    let startTime = 0
    let newInterval = 0

    await sleep(startAfter)

    // @note: Jitter [0, jitter) millis
    if (jitter) {
      await sleep(Math.floor(Math.random() * jitter))
    }

    let i = 0
    let error

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        this.log(`Job[${name}] starting`)
        startTime = Date.now()

        newInterval = (await intervalFn({ firstRun, interval })) || interval

        if (newInterval === JobRunnerReturnCode.Reset) {
          // @note: Reset the interval to its default value
          interval = it
        } else if (newInterval === JobRunnerReturnCode.Stop) {
          // @note: Stop the runner completelly
          this.stop()
        } else {
          // @note: Increase the interval adding the returned delta in milliseconds
          interval = Math.min(newInterval, intervalMax)
        }

        if (firstRun) {
          firstRun = false
          this._events.emit('firstRun')
        }

        i++
        error = undefined
      } catch (e) {
        error = e
        this.log(`Job[${name}] error`, e)
      }

      const elapsedTime = Date.now() - startTime
      const sleepTime = error
        ? 1000
        : intervalAccuracy
        ? Math.max(0, interval - elapsedTime)
        : interval

      this.log(
        `Job[${name}] finished [${i}/${times}] (took ${
          Duration.fromMillis(elapsedTime).toISOTime() || '+24h'
        })`,
      )

      if (!error && i >= times) {
        this.stop()
      }

      if (!this._isRunning) {
        this.log(`Job[${name}] stopped`)
        break
      }

      this.log(
        `Job[${name}] running again in ${
          Duration.fromMillis(sleepTime).toISOTime() || '+24h'
        } (${sleepTime})`,
      )

      this._events.emit('beforeSleep', sleepTime)

      await sleep(sleepTime)
    }

    const p = this._finished
    this._finished = new Future()
    p.resolve()
  }

  /**
   * Stops the runner.
   */
  stop(): Promise<void> {
    this._isRunning = false
    return this.hasFinished()
  }

  /**
   * Returns a promise that resolves when the runner is finished.
   */
  hasFinished(): Promise<void> {
    return this._finished.promise
  }

  protected parseOptions(options?: PartialJobRunnerOptions): void {
    if (!options) return

    const mergedOptions = {
      ...this.options,
      ...options,
    }

    let {
      verbose,
      intervalAccuracy,
      intervalMax,
      intervalInit,
      startAfter,
      times,
      jitter,
    } = mergedOptions

    const { interval } = mergedOptions

    if (verbose === undefined) {
      verbose = true
    }

    if (intervalAccuracy === undefined) {
      intervalAccuracy = true
    }

    if (intervalMax === undefined) {
      intervalMax = Number.MAX_SAFE_INTEGER
    }

    if (intervalInit === undefined) {
      intervalInit = interval
    }

    if (startAfter === undefined) {
      startAfter = 0
    }

    if (times === undefined) {
      times = Number.POSITIVE_INFINITY
    }

    if (jitter === undefined) {
      jitter = 0
    }

    this.options = {
      ...mergedOptions,
      intervalAccuracy,
      verbose,
      intervalMax,
      intervalInit,
      startAfter,
      times,
      jitter,
    }
  }
}
