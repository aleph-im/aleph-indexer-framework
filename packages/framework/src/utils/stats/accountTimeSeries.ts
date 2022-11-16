import { Utils } from '@aleph-indexer/core'
import { IndexerMsI } from '../../services/indexer/index.js'
import {
  toInterval,
} from '../time.js'
import {
  StatsStateStorage,
} from './dal/statsState.js'
import { StatsTimeSeriesStorage } from './dal/statsTimeSeries.js'
import {
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountTimeSeriesStatsConfig,
  AccountStats,
} from './types.js'
import {DateTime, Interval} from "luxon";

const { JobRunner } = Utils

/**
 * Defines the account stats handler class.
 */
export class AccountTimeSeriesStatsManager {
  protected compactionJob!: Utils.JobRunner
  protected stats!: AccountStats

  constructor(
    public config: AccountTimeSeriesStatsConfig,
    protected indexerApi: IndexerMsI,
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
      timeFrame,
      series,
    }
  }

  async getStats(): Promise<AccountStats> {
    if (!this.stats) {
      await this.aggregateAccountStats(Date.now())
    }

    return this.stats
  }

  async process(now: number): Promise<void> {
    await this.aggregateTimeSeries(now)
    await this.aggregateAccountStats(now)
  }

  protected async aggregateTimeSeries(now: number): Promise<void> {
    const { account } = this.config

    const state = await this.indexerApi.getAccountState({ account })
    if (!state) return

    if (!state.processed.length) return

    const generatePendingRanges = function* () {
      for(const isoDateTime of state.processed) {
        yield Interval.fromISO(isoDateTime)
      }
    }

    let minDate: DateTime | undefined

    if (state.accurate) {
      const minProcessedDate = toInterval(
        state.processed[0],
      ).start

      if (!state.pending.length) {
        minDate = minProcessedDate
      } else {
        const minPendingDate = toInterval(
          state.pending[0],
        ).start

        if (minProcessedDate <= minPendingDate) {
          minDate = minProcessedDate
        }
      }
    }

    for (const timeSeries of this.config.series) {
      await timeSeries.process(account, now, generatePendingRanges(), minDate)
    }
  }

  // @todo: check if 'now' is needed
  protected async aggregateAccountStats(now: number): Promise<void> {
    const { account, aggregate } = this.config
    const { timeSeriesDAL } = this

    if (aggregate) {
      const stats = await aggregate({ now: DateTime.now(), account, timeSeriesDAL })
      this.stats = { account, stats }
      return
    }
  }

  protected async compactStates(): Promise<void> {
    for (const timeSeries of this.config.series) {
      await timeSeries.compactStates(this.config.account)
    }
  }
}
