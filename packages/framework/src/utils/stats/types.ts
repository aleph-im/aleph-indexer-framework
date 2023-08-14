import { Interval } from 'luxon'
import { StorageValueStream } from '@aleph-indexer/core'
import { TimeFrame } from '../time.js'
import { TimeSeriesStats } from './timeSeries.js'
import { StatsTimeSeriesStorage } from './dal/statsTimeSeries.js'
import { BlockchainId, IndexableEntityType } from '../../types.js'

export type PrevValueFactoryFnArgs = {
  account: string
  type: string
  timeFrame: TimeFrame
  interval: Interval
  reverse?: boolean
}

export type InputStreamFactoryFnArgs = {
  account: string
  startDate: number
  endDate: number
}

export type TimeSeriesAggregatorFnArgs<I, O> = {
  input: I | O
  interval: Interval
  prevValue?: O
  cache: Record<string, unknown>
}

/**
 * Arguments to aggregate account stats.
 */
export type AccountAggregatorFnArgs = {
  /**
   * The timestamp of the current block.
   */
  now: number
  /**
   * The account address.
   */
  account: string
  /**
   * The entity storage for time series stats.
   */
  timeSeriesDAL: StatsTimeSeriesStorage
}

/**
 * Configuration for a time series stats aggregator.
 *
 * @typeParam I The type of the events in the input stream.
 * @typeParam O The type of the time series entities in the output stream.
 */
export type TimeSeriesStatsConfig<I, O> = {
  /**
   * The user defined type of the time series. Must be unique.
   */
  type: string
  /**
   * The start date in milliseconds at which to start aggregating the time series.
   */
  startDate: number
  /**
   * The time frame sizes to aggregate.
   */
  timeFrames: TimeFrame[]
  /**
   * The function representing the event input stream for the given time frame.
   * @param args The arguments to be passed to the input stream.
   * @returns The event stream.
   */
  getInputStream: (
    args: InputStreamFactoryFnArgs,
  ) => Promise<StorageValueStream<I>>
  /**
   * The function to aggregate the input stream with.
   * @param args The arguments to be passed to the aggregator.
   */
  aggregate: (args: TimeSeriesAggregatorFnArgs<I, O>) => O
  /**
   * Whether to process the time series in reverse order (from first to last).
   * If false, then the latest events will be processed first.
   */
  reverse?: boolean
}

/**
 * Configuration for an account stats aggregator.
 *
 * @typeParam V The type of the account stats being aggregated.
 */
export type AccountTimeSeriesStatsConfig<V> = {
  /**
   * The blockchain that this aggregator uses.
   */
  blockchainId: BlockchainId
  /**
   * The type of events/entities that this aggregator processes.
   */
  type: IndexableEntityType
  /**
   * The account address.
   */
  account: string
  /**
   * A list of time series stats aggregators that use the same input stream
   * of given account.
   */
  series: TimeSeriesStats<any, any>[]
  /**
   * The function to aggregate the account stats from the time series.
   * @param args The arguments to be passed to the aggregator.
   */
  aggregate?: (args: AccountAggregatorFnArgs) => Promise<V>
}

export type TypedValue = { type: string }

/**
 * A single time series measurement or bucket aggregation.
 *
 * @typeParam V The type of the value.
 */
export type TimeSeriesItem<V = any> = {
  date: string // ISO left bound of the interval
  value: V & TypedValue
}

/**
 * A time series consisting of multiple measurements or buckets.
 *
 * @typeParam V The type of the item values.
 */
export type TimeSeries<V = any> = TimeSeriesItem<V>[]

/**
 * Time-series stats for the given account.
 *
 * @typeParam V The type of the time series values.
 */
export type AccountTimeSeriesStats<V = any> = {
  /**
   * The account address.
   */
  account: string
  /**
   * The type of the time series.
   */
  type: string
  /**
   * The bucket size of the time series.
   */
  timeFrame: TimeFrame
  /**
   * The time series.
   */
  series: TimeSeries<V>
}

/**
 * Stats of the given account.
 *
 * @typeParam V The type of the account stats.
 */
export type AccountStats<V = any> = {
  /**
   * The account address.
   */
  account: string
  /**
   * The aggregated stats.
   */
  stats: V
}

/**
 * Transformations and clipping to apply to the time-series.
 */
export type AccountStatsFilters = {
  /**
   * The bucket size of the time series to be fetched.
   */
  timeFrame: TimeFrame
  /**
   * The start date in milliseconds at which to start fetching the time series.
   */
  startDate?: number
  /**
   * The end date in milliseconds at which to end fetching the time series.
   */
  endDate?: number
  /**
   * The maximum number of time series items to fetch.
   */
  limit?: number
  /**
   * Whether to process the time series in reverse order (from first to last).
   */
  reverse?: boolean
}
