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

export class JobRunner {
  private _events = new EventEmitter()
  private _isRunning = false
  private _finished = new Future<void>()

  protected options!: Required<JobRunnerOptions>

  constructor(options: JobRunnerOptions) {
    let {
      verbose,
      intervalAccuracy,
      intervalMax,
      intervalInit,
      startAfter,
      times,
      jitter,
    } = options

    const { interval } = options

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
      ...options,
      intervalAccuracy,
      verbose,
      intervalMax,
      intervalInit,
      startAfter,
      times,
      jitter,
    }
  }

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

  async start(): Promise<void> {
    return this.run()
  }

  async run(): Promise<void> {
    if (this._isRunning) return
    this._isRunning = true

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

  stop(): Promise<void> {
    this._isRunning = false
    return this.hasFinished()
  }

  hasFinished(): Promise<void> {
    return this._finished.promise
  }
}
