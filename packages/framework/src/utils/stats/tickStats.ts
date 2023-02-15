import { Utils } from '@aleph-indexer/core'
import { DateTime } from 'luxon'
import { DateRange } from '../time.js'
import { TimeSeriesStatsConfig, TimeSeries, TimeSeriesStatsFilters } from './types.js'
import { TickEntity, TickStatsStorage } from './dal/tickEntity.js'
import { StatsI } from './interface.js'
import { EventBase } from '../../types.js'

const { BufferExec } = Utils

/**
 * Base class for time series stats.
 * @type I The event type that the stats are based on.
 * @type O The time frame type of the stats ("candles"/"bars").
 */
export class TickStats<I extends EventBase<any>, O> implements StatsI<I, O> {
  constructor(
    public config: TimeSeriesStatsConfig<I, O>,
    protected tickDAL: TickStatsStorage,
  ) {
  }

  /**
   * Get the stats for a given interval, time frame size and account.
   * @param account The account to get the stats for.
   * @param timeFrame The time frame or candle size to get the stats for.
   * @param startDate The start date of the interval.
   * @param endDate The end date of the interval.
   * @param limit The maximum number of time frames to return.
   * @param reverse Whether to process the time frames in reverse order (oldest-to-newest).
   */
  async getStats(
    account: string,
    {
      startDate,
      endDate,
      limit = 1000,
      reverse = true,
    }: TimeSeriesStatsFilters,
  ): Promise<TimeSeries> {
    const { type } = this.config

    const values = await this.tickDAL.getAllValuesFromTo(
      [account, type, startDate],
      [account, type, endDate],
      { limit, reverse },
    )

    const series = []

    for await (const value of values) {
      value.data.type = type

      series.push({
        date: DateTime.fromMillis(value.date).toUTC().toISO(),
        value: value.data,
      })

      if (limit > 0 && series.length >= limit) return series
    }

    return series
  }

  /**
   * Process the events for a given account into time frames.
   * This function assumes that the input has no gaps.
   * @param account The account to process the events for.
   * @param now The current unix timestamp.
   * @param pendingDateRanges The still pending range of events to process.
   * @param minDate @todo: what is this for?
   */
  async process(
    account: string,
    now: number,
    pendingDateRanges: DateRange[],
    minDate: number | undefined,
  ): Promise<void> {
    const {
      type,
      beginStatsDate,
      getInputStream,
      aggregate: aggregator,
      reverse,
    } = this.config

    console.log(`📈 processing ${type} ticks for ${account}`)
    let latestProcessedTick: TickEntity<O> | undefined
    let startDate = beginStatsDate
    let endDate = now
    if (reverse) {
      latestProcessedTick = await this.tickDAL.getFirstValueFromTo(
        [account, type, beginStatsDate],
        [account, type, now],
      )
      if (latestProcessedTick) {
        endDate = latestProcessedTick.date
      }
    } else {
      latestProcessedTick = await this.tickDAL.getLastValueFromTo(
        [account, type, beginStatsDate],
        [account, type, now],
      )
      if (latestProcessedTick) {
        startDate = latestProcessedTick.date
      }
    }

    let addedEntries = 0
    const processedTicksBuffer = new BufferExec<TickEntity<O>>(async (entries) => {
      await this.tickDAL.save(entries)
      addedEntries += entries.length
    }, 1000)

    const inputs = await getInputStream({
      account,
      startDate,
      endDate,
    })

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
        date: input.timestamp,
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
        date: input.timestamp,
        data,
      })
    }
    await processedTicksBuffer.drain()

    console.log(`📈 added ${addedEntries} ${type} ticks for ${account}`)
  }
}
