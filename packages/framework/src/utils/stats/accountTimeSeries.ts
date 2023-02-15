import { Utils } from '@aleph-indexer/core'
import { IndexerMsClient } from '../../services/indexer/index.js'
import { DateRange, getDateRangeFromInterval, mergeDateRangesFromIterable, TimeFrame } from '../time.js'
import {
  TimeSeriesState,
  TimeSeriesStateCode,
  TimeSeriesStateDALIndex,
  TimeSeriesStateStorage,
} from './dal/timeSeriesState.js'
import { TimeSeriesStatsStorage } from './dal/timeSeriesEntity.js'
import {
  AccountStats,
  AccountTimeSeriesStats,
  AccountTimeSeriesStatsConfig,
  TimeSeries,
  TimeSeriesStatsFilters,
  SnapshotFilters,
} from './types.js'

const { JobRunner } = Utils

/**
 * Defines the account stats handler class.
 */
export class AccountTimeSeriesStatsManager<V> {
  protected compactionJob!: Utils.JobRunner
  protected stats!: AccountStats<V>

  constructor(
    public config: AccountTimeSeriesStatsConfig<V>,
    protected indexerClient: IndexerMsClient,
    protected stateDAL: TimeSeriesStateStorage,
    protected timeSeriesDAL: TimeSeriesStatsStorage,
  ) {
    this.compactionJob = new JobRunner({
      name: `stats-compactor ${config.account}`,
      interval: 1000 * 60 * 5, // 5min
      intervalFn: this.compactStates.bind(this),
    })

    this.init()
  }

  async init(): Promise<void> {
    this.compactionJob.run().catch(() => 'ignore')
  }

  async getSnapshot(
    type: string,
    filters: SnapshotFilters,
  ): Promise<TimeSeries<V>> {
    const { account } = this.config
    const timeSeries = this.config.series.find(
      (serie) => serie.config.type === type,
    )

    if (!timeSeries)
      throw new Error(`Stats for ${account} of type "${type}" not found`)

    return timeSeries.getSnapshot(account, filters)
  }

  async getTimeSeriesStats(
    type: string,
    filters: TimeSeriesStatsFilters,
  ): Promise<AccountTimeSeriesStats<V>> {
    const { account } = this.config

    const timeSeries = this.config.series.find(
      (serie) => serie.config.type === type,
    )

    if (!timeSeries)
      throw new Error(`Stats for ${account} of type "${type}" not found`)

    const series = await timeSeries.getStats(account, filters)
    const timeFrame = filters.timeFrame

    return {
      account,
      type,
      timeFrame,
      series,
    }
  }

  async getStats(): Promise<AccountStats<V>> {
    if (!this.stats) {
      await this.aggregateAccountStats(Date.now())
    }
    return this.stats
  }

  async process(now: number): Promise<void> {
    console.log(`📊 processing time series stats for ${this.config.account}`)
    await this.aggregateTimeSeries(now)
    await this.aggregateAccountStats(now)
  }

  protected async aggregateTimeSeries(now: number): Promise<void> {
    const { blockchainId, type, account } = this.config

    const state = await this.indexerClient
      .useBlockchain(blockchainId)
      .getAccountState({ type, account })

    if (!state) return
    if (!state.processed.length) return

    const pendingRanges: DateRange[] = state.processed.map(
      getDateRangeFromInterval,
    )

    let minDate

    if (state.accurate) {
      const minProcessedDate = getDateRangeFromInterval(
        state.processed[0],
      ).startDate

      if (!state.pending.length) {
        minDate = minProcessedDate
      } else {
        const minPendingDate = getDateRangeFromInterval(
          state.pending[0],
        ).startDate

        if (minProcessedDate <= minPendingDate) {
          minDate = minProcessedDate
        }
      }
    }

    for (const timeSeries of this.config.series) {
      await timeSeries.process(account, now, pendingRanges, minDate)
    }
  }

  protected async aggregateAccountStats(now: number): Promise<void> {
    const { account, aggregate } = this.config
    const { timeSeriesDAL } = this

    if (aggregate) {
      console.log(`📊 aggregating account stats for ${account}`)
      const stats: V = await aggregate({ now, account, timeSeriesDAL })
      this.stats = { account, stats }
      return
    }
  }

  protected async compactStates(): Promise<void> {
    const { account } = this.config
    const { Processed } = TimeSeriesStateCode

    const fetchedRanges = await this.stateDAL
      .useIndex(TimeSeriesStateDALIndex.AccountTypeState)
      .getAllValuesFromTo([account, Processed], [account, Processed], {
        reverse: false,
      })

    const { newRanges, oldRanges } = await mergeDateRangesFromIterable(
      fetchedRanges,
    )

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

    if (newStates.length > 0) {
      console.log(
        `💿 compact stats states
        newRanges: ${newStates.length},
        toDeleteRanges: ${oldStates.length}
      `,
      )
    }

    await Promise.all([
      this.stateDAL.save(newStates),
      this.stateDAL.remove(oldStates),
    ])
  }
}
