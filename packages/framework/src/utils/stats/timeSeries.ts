import {Utils} from '@aleph-indexer/core'
import {DateTime, Interval} from 'luxon'
import {
  clipIntervals,
  generatorToArray,
  getIntervalsFromStorageStream,
  getNextInterval,
  getPreviousInterval,
  getTimeFrameIntervals, MAX_TIMEFRAME,
} from '../time.js'
import {StatsState, StatsStateState, StatsStateStorage,} from './dal/statsState.js'
import {StatsTimeSeries, StatsTimeSeriesStorage,} from './dal/statsTimeSeries.js'
import {AccountStatsFilters, TimeSeries, TimeSeriesStatsConfig} from './types.js'

const { BufferExec, getMostSignificantDurationUnitAndAmount } = Utils

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
      startTimestamp,
      endTimestamp,
      limit = 1000,
      reverse = true,
    }: AccountStatsFilters,
  ): Promise<TimeSeries> {
    const { type } = this.config

    const values = await this.timeSeriesDAL.getAllValuesFromTo(
      [account, type, timeFrame, startTimestamp],
      [account, type, timeFrame, endTimestamp],
      { limit, reverse },
    )

    const series = []

    for await (const value of values) {
      value.data.type = type

      series.push({
        date: DateTime.fromMillis(value.startTimestamp).toUTC().toISO(),
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
   * @param intervalsToProcess The requested time frames to process.
   * @param minDate @todo: what is this for?
   */
  async process(
    account: string,
    now: number,
    intervalsToProcess: Interval[],
    minDate: number | undefined,
  ): Promise<void> {
    const {
      timeFrames,
      type,
      startTimestamp,
      getInputStream,
      aggregate: aggregator,
      reverse,
    } = this.config

    const sortedTimeFrames = timeFrames.sort((a, b) => a.toMillis() - b.toMillis())

    if (startTimestamp !== undefined) {
      intervalsToProcess = clipIntervals(intervalsToProcess, Interval.fromDateTimes(
        DateTime.fromMillis(0),
        DateTime.fromMillis(startTimestamp - 1),
      ))
    }
    for (const [timeFrameIndex, pendingTimeFrame] of sortedTimeFrames.entries()) {
      let { unit: timeFrameUnit, amount: timeFrameAmount } = getMostSignificantDurationUnitAndAmount(pendingTimeFrame)

      // @note: get the previous time frame, which is able to cleanly divide the current time frame.
      let previousTimeFrameIndex = timeFrameIndex - 1
      if (!pendingTimeFrame.equals(MAX_TIMEFRAME) && previousTimeFrameIndex > 0) {
        const timeFrameMillis = pendingTimeFrame.toMillis()
        while (true) {
          if (previousTimeFrameIndex <= 0) break
          const smallerSize = sortedTimeFrames[previousTimeFrameIndex].toMillis()
          if (timeFrameMillis % smallerSize === 0) break
          previousTimeFrameIndex--
        }
      }

      let usedUnit, usedAmount

      // @note: get intervals which have already been processed
      const clipRangesStream = await this.stateDAL.getAllValuesFromTo(
        [account, type, pendingTimeFrame.toMillis()],
        [account, type, pendingTimeFrame.toMillis()],
        { reverse: false },
      )

      // @note: remove these processed intervals from the pending intervals
      const pendingIntervals = clipIntervals(
        intervalsToProcess,
        await generatorToArray(getIntervalsFromStorageStream(clipRangesStream)),
      )
      // @note: aggregate intervals one by one
      let addedEntries = 0
      for (const pendingInterval of pendingIntervals) {
        // @note: prepare the storage buffer that saves the processed intervals in batches
        const processedIntervalsBuffer = new BufferExec<StatsTimeSeries<O | undefined>>(async (entries) => {
          // @note: Save entries that have any data
          const valueEntries = entries.filter(
            (entry): entry is StatsTimeSeries<O> => entry.data !== undefined,
          )
          await this.timeSeriesDAL.save(valueEntries)
          addedEntries += valueEntries.length

          // @note: Save states for all interval, either with empty data or not
          const stateEntries: StatsState[] = entries.map(
            ({ account, startTimestamp, endTimestamp, type, timeFrame }) => ({
              account,
              startTimestamp,
              endTimestamp,
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
            if(!pendingTimeFrame.equals(MAX_TIMEFRAME)) {
              stateEntries.shift()
              stateEntries.pop()
            }
            const firstIndex = reverse ? stateEntries.length - 1 : 0
            const firstItem = stateEntries[firstIndex]

            if (
              firstItem.startTimestamp < pendingInterval.start.toMillis() &&
              pendingInterval.start.toMillis() !== minDate
            ) {
              //console.log(
              //  `📊 Recalculate incomplete FIRST interval ${type} ${timeFrameUnit} ${getIntervalFromDateRange(
              //    firstItem.startTimestamp, firstItem.endTimestamp,
              //  ).toISO()}`,
              //)
              reverse ? stateEntries.pop() : stateEntries.shift()
            }
          }

          // @note: Exclude last item if it is an incomplete interval
          // so the last interval (real time) will be recalculated always
          if (stateEntries.length) {
            const lastIndex = reverse ? 0 : stateEntries.length - 1
            const lastItem = stateEntries[lastIndex]

            if (lastItem.endTimestamp - 1 > pendingInterval.end.toMillis()) {
              //console.log(
              //  `📊 Recalculate incomplete LAST interval ${type} ${timeFrameUnit} ${getIntervalFromDateRange(
              //    lastItem.startTimestamp, lastItem.endTimestamp
              //  ).toISO()}`,
              //)
              reverse ? stateEntries.shift() : stateEntries.pop()
            }
          }

          await this.stateDAL.save(stateEntries)
        }, 1000)

        const intervals = getTimeFrameIntervals(
          pendingInterval,
          pendingTimeFrame,
          reverse,
        )

        if (!intervals.length) continue

        // @note: add the previous and following intervals to be calculated in case they might have been clipped
        if(!pendingTimeFrame.equals(MAX_TIMEFRAME)) {
          intervals.unshift(getPreviousInterval(intervals[0], pendingTimeFrame))
          intervals.push(getNextInterval(intervals[intervals.length - 1], pendingTimeFrame))
        }

        let aggregatedValues = 0
        for (const interval of intervals) {
          const startTimestamp = interval.start.toMillis()
          const endTimestamp = interval.end.toMillis() - 1

          // @note: get the data for the current interval aggregation, if previousTimeFrameIndex is -1, we fetch events
          const cache = {}
          const inputs =
            previousTimeFrameIndex < 0
              ? await getInputStream({
                  account,
                  startTimestamp,
                  endTimestamp,
                })
              : await this.timeSeriesDAL.getAllValuesFromTo(
                  [
                    account,
                    type,
                    sortedTimeFrames[previousTimeFrameIndex].toMillis(),
                    startTimestamp,
                  ],
                  [
                    account,
                    type,
                    sortedTimeFrames[previousTimeFrameIndex].toMillis(),
                    endTimestamp,
                  ],
                )

          // @note: aggregate the data
          let data: O | undefined
          for await (const value of inputs) {
            aggregatedValues++
            const input = 'data' in value && previousTimeFrameIndex >= 0 ? value.data : value
            data = await aggregator({
              input,
              interval,
              cache,
              prevValue: data,
            })
          }

          // @note: Save the interval
          await processedIntervalsBuffer.add({
            account,
            type,
            timeFrame: pendingTimeFrame.toMillis(),
            startTimestamp,
            endTimestamp,
            data,
          })
        }

        await processedIntervalsBuffer.drain()

        if (aggregatedValues) {
          if (previousTimeFrameIndex < 0) {
            console.log(
              `💹 ${type} ${timeFrameAmount}${timeFrameUnit} with ${aggregatedValues} events processed`,
            )
          } else {
            console.log(`💹 ${type} ${timeFrameAmount}${timeFrameUnit} with ${aggregatedValues} ${usedAmount}${usedUnit} entries processed`)
          }
      }
      }
      if (addedEntries) {
        console.log(`💹 Added ${addedEntries} ${timeFrameUnit} entries for ${account} in range ${
          Interval.fromDateTimes(
            intervalsToProcess[0].start,
            intervalsToProcess[intervalsToProcess.length - 1].end
          ).toISO()
        }`)
      }
    }
  }
}
