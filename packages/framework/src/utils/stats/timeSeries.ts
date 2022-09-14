import { Utils } from '@aleph-indexer/core'
import { DateTime } from 'luxon'
import {
  DateRange,
  getDateRangeFromInterval,
  getIntervalFromDateRange,
  getPreviousInterval,
  getTimeFrameIntervals,
  clipDateRangesFromIterable,
  mergeDateRangesFromIterable,
  TimeFrame,
} from '../time.js'
import {
  StatsStateStorage,
  StatsStateState,
  StatsStateDALIndex,
  StatsState,
} from './dal/statsState.js'
import {
  StatsTimeSeries,
  StatsTimeSeriesStorage,
} from './dal/statsTimeSeries.js'
import {
  PrevValueFactoryFnArgs,
  TimeSeriesStatsConfig,
  TimeSeries,
  AccountStatsFilters,
} from './types.js'

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

    const values = await this.timeSeriesDAL.getAllFromTo(
      [account, type, timeFrame, startDate],
      [account, type, timeFrame, endDate],
      { limit, reverse },
    )

    const series = []

    for await (const { value } of values) {
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

      const clipRangesStream = await this.stateDAL.getAllValuesFromTo(
        [account, type, timeFrame],
        [account, type, timeFrame],
        { reverse: false },
      )

      const pendingTimeFrameDateRanges = await clipDateRangesFromIterable(
        pendingDateRanges,
        clipRangesStream,
      )

      // @todo: reduce the depth of for loops, or at least make it more readable
      for (const pendingRange of pendingTimeFrameDateRanges) {
        const processedIntervalsBuffer = new BufferExec<
          StatsTimeSeries<O | undefined>
        >(async (entries) => {
          // @note: Save entries that have any data
          const valueEntries = entries.filter(
            (entry): entry is StatsTimeSeries<O> => entry.data !== undefined,
          )

          await this.timeSeriesDAL.save(valueEntries)

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

        if (!intervals.length) continue

        for (const interval of intervals) {
          const { startDate, endDate } = getDateRangeFromInterval(interval)

          // const key = [account, type, timeFrame, startDate]
          const cache = {}
          const inputs =
            timeFrameIndex === 0
              ? await getInputStream({
                  account,
                  startDate,
                  endDate: endDate - 1,
                })
              : await this.timeSeriesDAL.getAllFromTo(
                  [
                    account,
                    type,
                    sortedTimeFrames[timeFrameIndex - 1],
                    startDate,
                  ],
                  [
                    account,
                    type,
                    sortedTimeFrames[timeFrameIndex - 1],
                    endDate - 1,
                  ],
                )

          let data: O | undefined

          for await (const { value } of inputs) {
            const input = 'data' in value ? value.data : value
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
            endDate: endDate - 1,
            data,
          })
        }

        await processedIntervalsBuffer.drain()
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
      `🍔 compact stats states
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
