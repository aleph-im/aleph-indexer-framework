import {
  AccountTimeSeriesStatsManager,
  IndexerMsI,
  StatsStateStorage,
  StatsTimeSeriesStorage,
  TimeSeriesStats,
  MAX_TIMEFRAME
} from '@aleph-indexer/framework'
import { EventDALIndex, EventStorage } from '../../dal/event.js'
import { ParsedEvents } from '../../utils/layouts/index.js'
import { AccessTimeStats, MarinadeFinanceAccountStats } from '../../types.js'
import statsAggregator from './statsAggregator.js'
import accessAggregator from './timeSeriesAggregator.js'
import {Duration} from "luxon";

export async function createAccountStats(
  account: string,
  indexerApi: IndexerMsI,
  eventDAL: EventStorage,
  statsStateDAL: StatsStateStorage,
  statsTimeSeriesDAL: StatsTimeSeriesStorage,
): Promise<AccountTimeSeriesStatsManager<MarinadeFinanceAccountStats>> {
  // @note: this aggregator is used to aggregate usage stats for the account
  const accessTimeSeries = new TimeSeriesStats<ParsedEvents, AccessTimeStats>(
    {
      type: 'access',
      startTimestamp: 0,
      timeFrames: [
        Duration.fromDurationLike({hours: 1}),
        Duration.fromDurationLike({days: 1}),
        Duration.fromDurationLike({week: 1}),
        Duration.fromDurationLike({month: 1}),
        Duration.fromDurationLike({year: 1}),
        MAX_TIMEFRAME
      ],
      getInputStream: async ({ account, startTimestamp, endTimestamp }) => {
        return await eventDAL
          .useIndex(EventDALIndex.AccountTimestamp)
          .getAllValuesFromTo([account, startTimestamp], [account, endTimestamp])
      },
      aggregate: ({ input, prevValue }): AccessTimeStats => {
        return accessAggregator.aggregate(input, prevValue)
      },
    },
    statsStateDAL,
    statsTimeSeriesDAL,
  )

  return new AccountTimeSeriesStatsManager<MarinadeFinanceAccountStats>(
    {
      account,
      series: [accessTimeSeries], // place your other aggregated stats here
      aggregate(args) {
        return statsAggregator.aggregate(args)
      },
    },
    indexerApi,
    statsStateDAL,
    statsTimeSeriesDAL,
  )
}
