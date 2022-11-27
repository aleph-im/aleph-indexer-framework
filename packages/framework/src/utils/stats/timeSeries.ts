import {Utils} from '@aleph-indexer/core'
import {DateTime, Duration, Interval} from 'luxon'
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
import {StatsState, StatsStateDALIndex, StatsStateState, StatsStateStorage,} from './dal/statsState.js'
import {StatsTimeSeries, StatsTimeSeriesStorage,} from './dal/statsTimeSeries.js'
import {AccountStatsFilters, PrevValueFactoryFnArgs, TimeSeries, TimeSeriesStatsConfig,} from './types.js'

const { BufferExec } = Utils

/**
 * Base class for time series stats.
 * @type I The event type that the stats are based on.
 * @type O The time frame type of the stats ("candles"/"bars").
 */
export class TimeSeriesStats<I, O> {
  constructor(
    public config: TimeSeriesStatsConfig<I, O>,
    protected stateDAL: StatsStateStorage,
    protected timeSeriesDAL: StatsTimeSeriesStorage,
  ) {}

  /**
   * Get the stats for a given interval, time frame size and account.
   * @param account The account to get the stats for.
   * @param timeFrame The time frame or candle size to get the stats for.
   * @param startDate The start date of the interval.
   * @param endDate The end date of the interval.
   * @param limit The maximum number of time frames to return.
   * @param reverse Whether to return the time frames in reverse order (oldest-to-newest). @todo: correct?
   */
  async getStats(
    account: string,
    {
      timeFrame,
      startDate,
      endDate,
      limit = 1000,
      reverse = true,
    }: AccountStatsFilters,
  ): Promise<TimeSeries> {
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
      type,
      startDate,
      getInputStream,
      aggregate: aggregator,
      reverse,
    } = this.config

    const sortedTimeFrames = timeFrames.sort()

    if (startDate !== undefined) {
      pendingDateRanges = await clipDateRangesFromIterable(pendingDateRanges, [
        { startDate: 0, endDate: startDate - 1 },
      ])
    }
    for (const [timeFrameIndex, timeFrame] of sortedTimeFrames.entries()) {
      const timeFrameName = TimeFrame[timeFrame]
      console.log(`📈 processing ${type} ${timeFrameName} for ${account}`)

      // @note: get the previous time frame, which is able to cleanly divide the current time frame.
      let trueDivideTimeFrameIndex = timeFrameIndex
      if (timeFrameIndex > 0) {
        trueDivideTimeFrameIndex--
      }
      if (timeFrame !== TimeFrame.All && trueDivideTimeFrameIndex < 0) {
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
        const processedIntervalsBuffer = new BufferExec<
          StatsTimeSeries<O | undefined>
        >(async (entries) => {
          // @note: Save entries that have any data
          const valueEntries = entries.filter(
            (entry): entry is StatsTimeSeries<O> => entry.data !== undefined,
          )
          await this.timeSeriesDAL.save(valueEntries)
          addedEntries += valueEntries.length

          // @note: Save states for all interval, either with empty data or not
          const stateEntries: StatsState[] = entries.map(
            ({ account, startDate, endDate, type, timeFrame }) => ({
              account,
              startDate,
              endDate,
              type,
              timeFrame,
              state: StatsStateState.Processed,
            }),
          )

          // @note: Exclude first item if it is an incomplete interval
          // taking into account that the first interval can be smaller
          // depending on the date of the first input
          if (stateEntries.length) {
            // @note: Remove first and last item, as they were included
            // for including ranges that might be needed in bigger time frames
            if(timeFrame !== TimeFrame.All) {
              stateEntries.shift()
              stateEntries.pop()
            }
            const firstIndex = reverse ? stateEntries.length - 1 : 0
            const firstItem = stateEntries[firstIndex]

            if (
              firstItem.startDate < pendingRange.startDate &&
              pendingRange.startDate !== minDate
            ) {
              console.log(
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
              console.log(
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

        if(timeFrame !== TimeFrame.All) {
          intervals.unshift(getPreviousInterval(intervals[0], timeFrame))
          intervals.push(getNextInterval(intervals[intervals.length - 1], timeFrame))
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
            const input = 'data' in value && trueDivideTimeFrameIndex !== 0 ? value.data : value
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
        console.log(`💹 Added ${addedEntries} ${timeFrameName} entries for ${account} in range ${
          Interval.fromDateTimes(
            DateTime.fromMillis(pendingTimeFrameDateRanges[0].startDate),
            DateTime.fromMillis(pendingTimeFrameDateRanges[pendingTimeFrameDateRanges.length - 1].endDate)
          ).toISO()
        }`)
      }
    }
  }

  async getPrevValue({
    account,
    type,
    timeFrame: frame,
    interval,
    reverse,
  }: PrevValueFactoryFnArgs): Promise<O | undefined> {
    const prevInterval = getPreviousInterval(interval, frame, reverse)

    const key = [account, type, frame, prevInterval.start.toMillis()]
    const timeSeries = await this.timeSeriesDAL.get(key)

    return timeSeries?.data
  }

  protected async compactStates(account: string): Promise<void> {
    const { Processed } = StatsStateState

    const fetchedRanges = await this.stateDAL
      .useIndex(StatsStateDALIndex.AccountTypeState)
      .getAllValuesFromTo([account, Processed], [account, Processed], {
        reverse: false,
      })

    const { newRanges, oldRanges } = await mergeDateRangesFromIterable(
      fetchedRanges,
    )

    if (!newRanges.length) return

    const newStates = newRanges.map((range) => {
      const newState = range as StatsState
      newState.account = account
      newState.state = Processed
      return newState
    })

    const oldStates = oldRanges.map((range) => {
      const oldState = range as StatsState
      oldState.account = account
      oldState.state = Processed
      return oldState
    })

    console.log(
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
}
