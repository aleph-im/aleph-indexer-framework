import {DateTime, Duration, Interval} from 'luxon'
import { StorageValueStream } from '@aleph-indexer/core'
import { TimeSeriesStats } from './timeSeries.js'
import { StatsTimeSeriesStorage } from './dal/statsTimeSeries.js'

export type IntervalWithType = {
  interval: Interval
  type: string
}

export type PrevValueFactoryFnArgs = {
  account: string
  type: string
  timeFrame: Duration
  interval: Interval
  reverse?: boolean
}

export type InputStreamFactoryFnArgs = {
  account: string
  startDate: DateTime
  endDate: DateTime
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
  now: DateTime
  account: string
  timeSeriesDAL: StatsTimeSeriesStorage
}

export type TimeSeriesStatsConfig<I, O> = {
  type: string
  startDate: DateTime
  timeFrames: Duration[]
  getInputStream: (
    args: InputStreamFactoryFnArgs,
  ) => Promise<StorageValueStream<I>>
  aggregate: (args: TimeSeriesAggregatorFnArgs<I, O>) => O
  // getPrevValue?: (
  //   args: PrevValueFactoryFnArgs,
  //   defaultFn: (args: PrevValueFactoryFnArgs) => Promise<O | undefined>,
  // ) => Promise<O | undefined>
  reverse?: boolean
}

export type AccountTimeSeriesStatsConfig<V> = {
  account: string
  series: TimeSeriesStats<any, any>[]
  aggregate?: (args: AccountAggregatorFnArgs) => Promise<V>
}

export type TypedValue = { type: string }

export type TimeSeriesItem<V = any> = {
  date: string // ISO left bound of the interval
  value: V & TypedValue
}

export type TimeSeries<V = any> = TimeSeriesItem<V>[]

/**
 * Time-series stats for the given account.
 */
export type AccountTimeSeriesStats<V = any> = {
  account: string
  type: string
  timeFrame: Duration
  series: TimeSeries<V>
}

/**
 * Stats of the given account.
 */
export type AccountStats<V = any> = {
  account: string
  stats: V
}

/**
 * Transformations and clipping to apply to the time-series.
 */
export type AccountStatsFilters = {
  timeFrame: Duration
  startDate?: DateTime
  endDate?: DateTime
  limit?: number
  reverse?: boolean
}
