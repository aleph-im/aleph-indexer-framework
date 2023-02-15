import { Interval } from 'luxon'
import { StorageValueStream } from '@aleph-indexer/core'
import { TimeFrame } from '../time.js'
import { TimeSeriesStatsStorage } from './dal/timeSeriesEntity.js'
import { Blockchain, EventBase, IndexableEntityType } from '../../types.js'
import { TimeSeriesStats } from './timeSeriesStats.js'

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
  interval?: Interval
  prevValue?: O
  cache: Record<string, unknown>
}

/**
 * Arguments to aggregate account stats.
 */
export type AccountAggregatorFnArgs = {
  now: number
  account: string
  timeSeriesDAL: TimeSeriesStatsStorage
}

export type TimeSeriesStatsConfig<I extends EventBase<any>, O> = {
  type: string
  beginStatsDate: number
  getInputStream: (
    args: InputStreamFactoryFnArgs,
  ) => Promise<StorageValueStream<I>>
  aggregate: (args: TimeSeriesAggregatorFnArgs<I, O>) => O
  tickAggregate?: (args: TimeSeriesAggregatorFnArgs<I, O>) => O
  reverse?: boolean
  timeFrames: TimeFrame[]
}

export type AccountTimeSeriesStatsConfig<V> = {
  blockchainId: Blockchain
  type: IndexableEntityType
  account: string
  series: TimeSeriesStats<any, any>[]
  aggregate?: (args: AccountAggregatorFnArgs) => Promise<V>
}

export type TypedValue = { type: string }

export type TimeSeriesItem<V = any> = {
  date: string // ISO left bound of the time frame or the date of the tick
  value: V & TypedValue
}

export type TimeSeries<V = any> = TimeSeriesItem<V>[]

/**
 * Time-series stats for the given account.
 */
export type AccountTimeSeriesStats<V = any> = {
  account: string
  type: string
  timeFrame: TimeFrame
  series: TimeSeries<V>
}

/**
 * Stats of the given account.
 */
export type AccountStats<V = any> = {
  account: string
  stats: V
}

export type SnapshotFilters = {
    date: number,
    timeFrame: TimeFrame,
}

/**
 * Transformations and clipping to apply to the time-series.
 */
export type TimeSeriesStatsFilters = {
  timeFrame: TimeFrame
  startDate?: number
  endDate?: number
  limit?: number
  reverse?: boolean
}
