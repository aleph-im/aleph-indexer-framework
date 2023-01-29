import { Utils } from '@aleph-indexer/core'
import { IndexerMsClient } from '../../services/indexer/index.js'
import {
  getIntervalsFromStorageStream,
  mergeIntervals,
  intervalToTimeFrameDuration,
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
import { Duration, Interval } from 'luxon'

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

  async init(): Promise<void> {
    this.compactionJob.run().catch(() => 'ignore')
  }

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
      timeFrame: Duration.fromMillis(timeFrame),
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
    const { blockchainId, account } = this.config

    const state = await this.indexerClient
      .useBlockchain(blockchainId)
      .getAccountState({ account })

    if (!state) return

    //@note: If no transactions have been processed, nothing to do
    if (!state.processed.length) return

    //@note: The processed transactions are now pending to be aggregated
    const pendingIntervals: Interval[] = state.processed.map((interval) => {
      return Interval.fromISO(interval)
    })

    const unfetchedIntervals = state.pending.map((interval) => {
      return Interval.fromISO(interval)
    })

    let minDate

    if (state.accurate) {
      const minProcessedDate = pendingIntervals[0].start.toMillis()

      if (!state.pending.length) {
        //@note: If there are no pending transactions, we can aggregate all the processed transactions
        minDate = minProcessedDate
      } else {
        const minPendingDate = unfetchedIntervals[0].start.toMillis()

        //@note: If there are gaps in the processed transactions, then get the minimum date of the pending transactions
        if (minProcessedDate <= minPendingDate) {
          minDate = minProcessedDate
        }
      }
    }

    for (const timeSeries of this.config.series) {
      await timeSeries.process(account, now, pendingIntervals, minDate)
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

    for (const timeSeries of this.config.series) {
      const fetchedRanges = await this.stateDAL
        .useIndex(StatsStateDALIndex.AccountTypeState)
        .getAllValuesFromTo(
          [account, timeSeries.config.type, Processed],
          [account, timeSeries.config.type, Processed],
          {
            reverse: false,
          },
        )

      const { newRanges, oldRanges } = await mergeIntervals(
        getIntervalsFromStorageStream(fetchedRanges),
      )

      const newStates = newRanges.map((range) => {
        return {
          account,
          state: StatsStateState.Processed,
          startDate: range.start.toMillis(),
          endDate: range.end.toMillis(),
          type: timeSeries.config.type,
          timeFrame: intervalToTimeFrameDuration(range).toMillis(),
        }
      })

      const oldStates = oldRanges.map((range) => {
        return {
          account,
          state: StatsStateState.Processed,
          startDate: range.start.toMillis(),
          endDate: range.end.toMillis(),
          type: timeSeries.config.type,
          timeFrame: intervalToTimeFrameDuration(range).toMillis(),
        }
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
}
