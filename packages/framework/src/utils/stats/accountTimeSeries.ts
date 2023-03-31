import { Utils } from '@aleph-indexer/core'
import { IndexerMsClient } from '../../services/indexer/index.js'
import {
  DateRange,
  getDateRangeFromInterval,
  mergeDateRangesFromIterable,
} from '../time.js'
import {
  StatsStateStorage,
  StatsStateState,
  StatsStateDALIndex,
  StatsState,
} from './dal/statsState.js'
import { StatsTimeSeriesStorage } from './dal/statsTimeSeries.js'
import {
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountTimeSeriesStatsConfig,
  AccountStats,
} from './types.js'

const { JobRunner } = Utils

/**
 * This class handles the stats for a given account. It is responsible for
 * aggregating the stats from the time series and compacting the time series
 * database when needed.
 *
 * The stats are stored in two different places:
 * - The time series, which is a list of stats for a given time frame
 * - The state, which is the current state of the processed account stats
 *
 * @typeParam V The type of the value of the account stats
 */
export class AccountTimeSeriesStatsManager<V> {
  protected compactionJob!: Utils.JobRunner
  protected stats!: AccountStats<V>

  constructor(
    public config: AccountTimeSeriesStatsConfig<V>,
    protected indexerClient: IndexerMsClient,
    protected stateDAL: StatsStateStorage,
    protected timeSeriesDAL: StatsTimeSeriesStorage,
  ) {
    this.compactionJob = new JobRunner({
      name: `stats-compactor ${config.account}`,
      interval: 1000 * 60 * 5, // 5min
      intervalFn: this.compactStates.bind(this),
    })

    this.init()
  }

  /**
   * Initializes the account stats manager. It will start the compaction job.
   */
  async init(): Promise<void> {
    this.compactionJob.run().catch(() => 'ignore')
  }

  /**
   * Returns time series values for a given time frame.
   * @param type The type of the time series, as defined by the user
   * @param filters The filters to apply to the time series fetched
   */
  async getTimeSeriesStats(
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats> {
    const { account } = this.config

    const timeSeries = this.config.series.find(
      (serie) => serie.config.type === type,
    )

    if (!timeSeries)
      throw new Error(`Stats for ${account} of type "${type}" not found`)

    const series = await timeSeries.getStats(account, filters)
    const { timeFrame } = filters

    return {
      account,
      type,
      timeFrame,
      series,
    }
  }

  /**
   * Returns the currently aggregated account stats.
   */
  async getStats(): Promise<AccountStats<V>> {
    if (!this.stats) {
      await this.aggregateAccountStats(Date.now())
    }
    return this.stats
  }

  /**
   * Processes the account stats. It will trigger the processing of time stats
   * based on fetched events and aggregate the account stats.
   * @param now The timestamp to which to process past stats
   */
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
    const { Processed } = StatsStateState

    const fetchedRanges = await this.stateDAL
      .useIndex(StatsStateDALIndex.AccountTypeState)
      .getAllValuesFromTo([account, Processed], [account, Processed], {
        reverse: false,
      })

    const { newRanges, oldRanges } = await mergeDateRangesFromIterable(
      fetchedRanges,
    )

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
