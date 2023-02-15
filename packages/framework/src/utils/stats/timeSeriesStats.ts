import { Utils } from '@aleph-indexer/core'
import { DateTime, Duration, Interval } from 'luxon'
import {
  clipDateRangesFromIterable,
  DateRange,
  getDateRangeFromInterval,
  getIntervalFromDateRange,
  getNextInterval,
  getPreviousInterval,
  getTimeFrameIntervals,
  mergeDateRangesFromIterable,
  TimeFrame,
} from '../time.js'
import {
  TimeSeriesState,
  TimeSeriesStateCode,
  TimeSeriesStateDALIndex,
  TimeSeriesStateStorage,
} from './dal/timeSeriesState.js'
import { TimeSeriesEntity, TimeSeriesStatsStorage } from './dal/timeSeriesEntity.js'
import { TimeSeries, TimeSeriesStatsConfig, TimeSeriesStatsFilters } from './types.js'
import { EventBase } from '../../types.js'

const { BufferExec } = Utils

/**
 * Base class for time series stats.
 * @type I The event type that the stats are based on.
 * @type O The time frame type of the stats ("candles"/"bars").
 */
export class TimeSeriesStats<I extends EventBase<any>, O> {
  constructor(
    public config: TimeSeriesStatsConfig<I, O>,
    protected stateDAL: TimeSeriesStateStorage,
    protected timeSeriesDAL: TimeSeriesStatsStorage,
  ) {
  }

  /**
   * Get the stats for a given interval, time frame size and account.
   * @param account The account to get the stats for.
   * @param timeFrame The time frame or candle size to get the stats for.
   * @param startDate The start date of the interval.
   * @param endDate The end date of the interval.
   * @param limit The maximum number of time frames to return.
   * @param reverse Whether to return the time frames in reverse order (oldest-to-newest).
   */
  async getStats(
    account: string,
    {
      timeFrame,
      startDate,
      endDate,
      limit = 1000,
      reverse = true,
    }: TimeSeriesStatsFilters,
  ): Promise<TimeSeries<O>> {
    const { type } = this.config

    const values = await this.timeSeriesDAL.getAllValuesFromTo(
      [account, type, timeFrame, startDate],
      [account, type, timeFrame, endDate],
      { limit, reverse },
    )

    const series = []

    for await (const value of values) {
      value.data.type = type

      series.push({
        date: DateTime.fromMillis(value.startDate).toUTC().toISO(),
        value: value.data,
      })

      if (limit > 0 && series.length >= limit) return series
    }

    return series
  }

  /**
   * Process the events for a given account into time frames.
   * @todo: refactor for better readability.
   * @param account The account to process the events for.
   * @param now The current unix timestamp.
   * @param pendingDateRanges The requested time frames to process.
   * @param minDate @todo: what is this for?
   */
  async process(
    account: string,
    now: number,
    pendingDateRanges: DateRange[],
    minDate: number | undefined,
  ): Promise<void> {
    const {
      timeFrames,
      beginStatsDate,
    } = this.config

    const sortedTimeFrames = timeFrames.sort()

    if (beginStatsDate !== undefined) {
      pendingDateRanges = await clipDateRangesFromIterable(pendingDateRanges, [
        { startDate: 0, endDate: beginStatsDate - 1 },
      ])
    }
    for (const [timeFrameIndex, timeFrame] of sortedTimeFrames.entries()) {
      if(timeFrame === TimeFrame.Tick)
        await this.processTick(account, now, pendingDateRanges)
      else
        await this.processTimeFrame(account, now, pendingDateRanges, minDate, timeFrameIndex, timeFrame, sortedTimeFrames)
    }
  }

    /**
   * Process the events for a given account into time frames.
   * This function assumes that the input has no gaps.
   * @param account The account to process the events for.
   * @param now The current unix timestamp.
   * @param pendingDateRanges The still pending range of events to process.
   */
  async processTick(
    account: string,
    now: number,
    pendingDateRanges: DateRange[],
  ): Promise<void> {
    const {
      type,
      beginStatsDate,
      getInputStream,
      aggregate,
      tickAggregate,
      reverse,
    } = this.config

    console.log(`📈 processing ${type} ticks for ${account}`)
    let latestProcessedTick: TimeSeriesEntity<O> | undefined
    let startDate = beginStatsDate
    let endDate = now
    if (reverse) {
      latestProcessedTick = await this.timeSeriesDAL.getFirstValueFromTo(
        [account, type, TimeFrame.Tick, beginStatsDate],
        [account, type, TimeFrame.Tick, now],
      )
      if (latestProcessedTick) {
        endDate = latestProcessedTick.startDate
      }
    } else {
      latestProcessedTick = await this.timeSeriesDAL.getLastValueFromTo(
        [account, type, TimeFrame.Tick, beginStatsDate],
        [account, type, TimeFrame.Tick, now],
      )
      if (latestProcessedTick) {
        startDate = latestProcessedTick.startDate
      }
    }

    let addedEntries = 0
    const processedTicksBuffer = new BufferExec<TimeSeriesEntity<O>>(async (entries) => {
      await this.timeSeriesDAL.save(entries)
      addedEntries += entries.length
    }, 1000)

    const inputs = await getInputStream({
      account,
      startDate,
      endDate,
    })

    const aggregator = tickAggregate ?? aggregate
    let data = reverse ? undefined : latestProcessedTick?.data
    const cache = {}
    for await (const input of inputs) {
      data = await aggregator({
        input,
        cache,
        prevValue: data,
      })
      await processedTicksBuffer.add({
        account,
        type,
        timeFrame: TimeFrame.Tick,
        startDate: input.timestamp,
        endDate: input.timestamp,
        data,
      })
    }
    await processedTicksBuffer.drain()

    if (!reverse) return

    // update the later ticks
    const laterInputs = await getInputStream({
      account,
      startDate: endDate,
      endDate: now,
    })
    for await (const input of laterInputs) {
      data = await aggregator({
        input,
        cache,
        prevValue: data,
      })
      await processedTicksBuffer.add({
        account,
        type,
        timeFrame: TimeFrame.Tick,
        startDate: input.timestamp,
        endDate: input.timestamp,
        data,
      })
    }
    await processedTicksBuffer.drain()

    console.log(`📈 added ${addedEntries} ${type} ticks for ${account}`)
  }

  protected async processTimeFrame(
    account: string,
    now: number,
    pendingDateRanges: DateRange[],
    minDate: number | undefined,
    timeFrameIndex: number,
    timeFrame: TimeFrame,
    sortedTimeFrames: TimeFrame[],
  ): Promise<void> {
    const {
      type,
      getInputStream,
      aggregate: aggregator,
      reverse,
    } = this.config
    const timeFrameName = TimeFrame[timeFrame]
    console.log(`📈 processing ${type} ${timeFrameName} for ${account}`)

    // @note: get the previous time frame, which is able to cleanly divide the current time frame.
    let trueDivideTimeFrameIndex = timeFrameIndex
    if (timeFrameIndex > 0) {
      trueDivideTimeFrameIndex--
    }
    if (timeFrame !== TimeFrame.All && trueDivideTimeFrameIndex > 0) {
      const timeFrameSize = Duration.fromObject({[timeFrameName.toLowerCase()]: 1}).toMillis()
      while (true) {
        if (trueDivideTimeFrameIndex <= 0) break
        const smallerSize = Duration.fromObject({[TimeFrame[sortedTimeFrames[trueDivideTimeFrameIndex]].toLowerCase()]: 1}).toMillis()
        if (timeFrameSize % smallerSize === 0) break
        trueDivideTimeFrameIndex--
      }
    }

    const clipRangesStream = await this.stateDAL.getAllValuesFromTo(
      [account, type, timeFrame],
      [account, type, timeFrame],
      { reverse: false },
    )

    const pendingTimeFrameDateRanges = await clipDateRangesFromIterable(
      pendingDateRanges,
      clipRangesStream,
    )
    let addedEntries = 0
    for (const pendingRange of pendingTimeFrameDateRanges) {
      const processedIntervalsBuffer = new BufferExec<TimeSeriesEntity<O | undefined>>(async (entries) => {
        // @note: Save entries that have any data
        const valueEntries = entries.filter(
          (entry): entry is TimeSeriesEntity<O> => entry.data !== undefined,
        )
        await this.timeSeriesDAL.save(valueEntries)
        addedEntries += valueEntries.length

        // @note: Save states for all interval, either with empty data or not
        const stateEntries: TimeSeriesState[] = entries.map(
          ({ account, startDate, endDate, type, timeFrame }) => ({
            account,
            startDate,
            endDate,
            type,
            timeFrame,
            state: TimeSeriesStateCode.Processed,
          }),
        )

        // @note: Exclude first item if it is an incomplete interval
        // taking into account that the first interval can be smaller
        // depending on the date of the first input
        if (stateEntries.length) {
          // @note: Remove first and last item, as they were included
          // for including ranges that might be needed in bigger time frames
          if (timeFrame !== TimeFrame.All) {
            stateEntries.shift()
            stateEntries.pop()
          }
          const firstIndex = reverse ? stateEntries.length - 1 : 0
          const firstItem = stateEntries[firstIndex]

          if (
            firstItem.startDate < pendingRange.startDate &&
            pendingRange.startDate !== minDate
          ) {
            this.log(
              `📊 Recalculate incomplete FIRST interval ${type} ${timeFrameName} ${getIntervalFromDateRange(
                firstItem,
              ).toISO()}`,
            )
            reverse ? stateEntries.pop() : stateEntries.shift()
          }
        }

        // @note: Exclude last item if it is an incomplete interval
        // so the last interval (real time) will be recalculated always
        if (stateEntries.length) {
          const lastIndex = reverse ? 0 : stateEntries.length - 1
          const lastItem = stateEntries[lastIndex]

          if (lastItem.endDate - 1 > pendingRange.endDate) {
            this.log(
              `📊 Recalculate incomplete LAST interval ${type} ${timeFrameName} ${getIntervalFromDateRange(
                lastItem,
              ).toISO()}`,
            )
            reverse ? stateEntries.shift() : stateEntries.pop()
          }
        }

        await this.stateDAL.save(stateEntries)
      }, 1000)
      const pendingInterval = getIntervalFromDateRange(pendingRange)

      const intervals = getTimeFrameIntervals(
        pendingInterval,
        timeFrame,
        reverse,
      )

      if (timeFrame !== TimeFrame.All) {
        intervals.unshift(getPreviousInterval(intervals[0], timeFrame))
        intervals.push(
          getNextInterval(intervals[intervals.length - 1], timeFrame),
        )
      }

      if (!intervals.length) continue

      for (const interval of intervals) {
        let { startDate, endDate } = getDateRangeFromInterval(interval)
        endDate = endDate - 1

        // const key = [account, type, timeFrame, startDate]
        const cache = {}
        const inputs =
          trueDivideTimeFrameIndex === 0
            ? await getInputStream({
                account,
                startDate,
                endDate,
              })
            : await this.timeSeriesDAL.getAllValuesFromTo(
                [
                  account,
                  type,
                  sortedTimeFrames[trueDivideTimeFrameIndex],
                  startDate,
                ],
                [
                  account,
                  type,
                  sortedTimeFrames[trueDivideTimeFrameIndex],
                  endDate,
                ],
              )

        let data: O | undefined
        for await (const value of inputs) {
          const input =
            'data' in value && trueDivideTimeFrameIndex !== 0 ? value.data : value
          data = await aggregator({
            input,
            interval,
            cache,
            prevValue: data,
          })
        }

        await processedIntervalsBuffer.add({
          account,
          type,
          timeFrame,
          startDate,
          endDate,
          data,
        })
      }

      await processedIntervalsBuffer.drain()
    }
    if (addedEntries) {
      this.log(
        `💹 Added ${addedEntries} ${timeFrameName} entries for ${account} in range ${Interval.fromDateTimes(
          DateTime.fromMillis(pendingTimeFrameDateRanges[0].startDate),
          DateTime.fromMillis(
            pendingTimeFrameDateRanges[pendingTimeFrameDateRanges.length - 1]
              .endDate,
          ),
        ).toISO()}`,
      )
    }
  }

  protected async compactStates(account: string): Promise<void> {
    const { Processed } = TimeSeriesStateCode

    const fetchedRanges = await this.stateDAL
      .useIndex(TimeSeriesStateDALIndex.AccountTypeState)
      .getAllValuesFromTo([account, Processed], [account, Processed], {
        reverse: false,
      })

    const { newRanges, oldRanges } = await mergeDateRangesFromIterable(
      fetchedRanges,
    )

    if (!newRanges.length) return

    const newStates = newRanges.map((range) => {
      const newState = range as TimeSeriesState
      newState.account = account
      newState.state = Processed
      return newState
    })

    const oldStates = oldRanges.map((range) => {
      const oldState = range as TimeSeriesState
      oldState.account = account
      oldState.state = Processed
      return oldState
    })

    this.log(
      `💿 compact stats states
        newRanges: ${newStates.length},
        toDeleteRanges: ${oldStates.length}
      `,
    )

    await Promise.all([
      this.stateDAL.save(newStates),
      this.stateDAL.remove(oldStates),
    ])
  }

  protected log(...msgs: any[]): void {
    console.log(`${this.config.type} | ${msgs.join(' ')}`)
  }
}