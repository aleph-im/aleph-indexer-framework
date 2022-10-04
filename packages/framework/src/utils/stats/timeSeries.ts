import { Utils } from '@aleph-indexer/core'
import {DateTime, Interval} from 'luxon'
import {
  getIntervalFromDateRange,
  getPreviousInterval,
  getTimeFrameIntervals,
  mergeIntervals,
  getMostSignificantDurationUnitAndSize,
  clipIntervals,
  getIntervalsFromStorageStream,
  prepareIntervals,
} from '../time.js'
import {
  StatsStateStorage,
  StatsStateStatus,
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

    const values = await this.timeSeriesDAL.getAllValuesFromTo(
      [account, type, timeFrame.toMillis(), startDate?.toMillis()],
      [account, type, timeFrame.toMillis(), endDate?.toMillis()],
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
   * @param pendingIntervals The requested time frames to process.
   * @param minDate @todo: what is this for?
   */
  async process(
    account: string,
    now: number,
    pendingIntervals: Generator<Interval> | AsyncGenerator<Interval>,
    minDate: DateTime | undefined,
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
      pendingIntervals = clipIntervals(pendingIntervals, [
        Interval.fromDateTimes(
          DateTime.fromMillis(0), startDate.minus(1)
        ),
      ])
    }

    for (const [timeFrameIndex, timeFrame] of sortedTimeFrames.entries()) {
      const { unit: timeFrameName, size: timeFrameSize } = getMostSignificantDurationUnitAndSize(timeFrame)

      // @note: get the previous time frame, which is able to cleanly divide the current time frame.
      let trueDivideTimeFrameIndex = timeFrameIndex - 1
      while (true) {
        if (trueDivideTimeFrameIndex < 0) break
        if (timeFrameSize % sortedTimeFrames[trueDivideTimeFrameIndex].as(timeFrameName) === 0) break
        trueDivideTimeFrameIndex--
      }

      const clipRangesStream = await this.stateDAL.getAllValuesFromTo(
        [account, type, timeFrame.toMillis()],
        [account, type, timeFrame.toMillis()],
        { reverse: false },
      )

      // @note: sort and clip the pending intervals to the ranges that are already processed.
      const pendingTimeFrameIntervals = await prepareIntervals(
        pendingIntervals,
        getIntervalsFromStorageStream(clipRangesStream)
      )

      for (const pendingInterval of pendingTimeFrameIntervals) {
        const processedIntervalsBuffer = this.getProcessedIntervalsBuffer(
          reverse,
          pendingInterval,
          minDate?.toMillis(),
          type,
          timeFrameName
        )

        const intervals = getTimeFrameIntervals(
          pendingInterval,
          timeFrame,
          reverse,
        )

        for await (const interval of intervals) {
          const timeFrameInMillis = sortedTimeFrames[trueDivideTimeFrameIndex].toMillis()
          const cache = {}
          const inputs =
            trueDivideTimeFrameIndex === 0
              ? await getInputStream({
                  account,
                  startDate: interval.start,
                  endDate: interval.end.minus(1),
                })
              : await this.timeSeriesDAL.getAllValuesFromTo(
                  [
                    account,
                    type,
                    timeFrameInMillis,
                    interval.start.toMillis(),
                  ],
                  [
                    account,
                    type,
                    timeFrameInMillis,
                    interval.end.toMillis(),
                  ],
                )

          let data: O | undefined

          for await (const value of inputs) {
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
            timeFrame: timeFrameInMillis,
            startDate: interval.start.toMillis(),
            endDate: interval.end.minus(1).toMillis(),
            data,
          })
        }

        await processedIntervalsBuffer.drain()
      }
    }
  }

  private getProcessedIntervalsBuffer(
    reverse: boolean | undefined,
    pendingRange: Interval,
    minDate: number | undefined,
    type: string,
    timeFrameName: string)
  {
    return new BufferExec<StatsTimeSeries<O | undefined>>(async (entries) => {
      // @note: Save entries that have any data
      const valueEntries = entries.filter(
        (entry): entry is StatsTimeSeries<O> => entry.data !== undefined,
      )

      await this.timeSeriesDAL.save(valueEntries)

      // @note: Save states for all interval, either with empty data or not
      const stateEntries: StatsState[] = entries.map(
        ({account, startDate, endDate, type, timeFrame}) => ({
          account,
          startDate,
          endDate,
          type,
          timeFrame,
          state: StatsStateStatus.Processed,
        }),
      )

      // @note: Exclude first item if it is an incomplete interval
      // taking into account that the first interval can be smaller
      // depending on the date of the first input
      if (stateEntries.length) {
        const firstIndex = reverse ? stateEntries.length - 1 : 0
        const firstItem = stateEntries[firstIndex]

        if (
          firstItem.startDate < pendingRange.start.toMillis() &&
          pendingRange.start.toMillis() !== minDate
        ) {
          console.log(
            `📊 Recalculate incomplete FIRST interval ${type} ${timeFrameName} ${getIntervalFromDateRange(
              firstItem.startDate, firstItem.endDate
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

        if (lastItem.endDate - 1 > pendingRange.end.toMillis()) {
          console.log(
            `📊 Recalculate incomplete LAST interval ${type} ${timeFrameName} ${getIntervalFromDateRange(
              lastItem.startDate, lastItem.endDate
            ).toISO()}`,
          )
          reverse ? stateEntries.shift() : stateEntries.pop()
        }
      }

      await this.stateDAL.save(stateEntries)
    }, 1000);
  }

  async getPrevValue({
    account,
    type,
    timeFrame,
    interval,
    reverse,
  }: PrevValueFactoryFnArgs): Promise<O | undefined> {
    const prevInterval = getPreviousInterval(interval, timeFrame, reverse)

    const timeSeries = await this.timeSeriesDAL.get([
      account,
      type,
      timeFrame.toMillis(),
      prevInterval.start.toMillis()
    ])

    return timeSeries?.data
  }

  public async compactStates(account: string): Promise<void> {
    const { type } = this.config
    const { Processed } = StatsStateStatus

    // @note: entries from DAL are always sorted
    const fetchedRanges = await this.stateDAL
      .useIndex(StatsStateDALIndex.AccountTypeState)
      .getAllValuesFromTo([account, type, Processed], [account, type, Processed], {
        reverse: false,
      })

    const { newRanges, oldRanges } = await mergeIntervals(
      getIntervalsFromStorageStream(fetchedRanges),
    )

    if (!newRanges.length) return

    const newStates = newRanges.map((range) => {
      return {
        startDate: range.start.toMillis(),
        endDate: range.end.toMillis(),
        timeFrame: range.toDuration().toMillis(),
        state: Processed,
        account,
        type
      }
    })

    const oldStates = oldRanges.map((range) => {
      return {
        startDate: range.start.toMillis(),
        endDate: range.end.toMillis(),
        timeFrame: range.toDuration().toMillis(),
        state: Processed,
        account,
        type
      }
    })

    console.log(
      `💿 compact stats states
        new ranges to save: ${newStates.length},
        old ranges to delete: ${oldStates.length}
      `,
    )

    await Promise.all([
      this.stateDAL.save(newStates),
      this.stateDAL.remove(oldStates),
    ])
  }
}
