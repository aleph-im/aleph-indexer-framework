import {
  AccountTimeSeriesStatsManager,
  IndexerMsI,
  StatsStateStorage,
  StatsTimeSeriesStorage,
  TimeFrame,
  TimeSeriesStats,
} from '@aleph-indexer/framework'
import { EventDALIndex, EventStorage } from '../../dal/event.js'
import { LendingEvent, LendingInfo, LendingReserveStats } from '../../types'
import { ReserveStatsAggregatorFactory } from './reserve/index.js'
import lendingEventAggregator from './timeSeriesAggregator.js'

export async function createAccountStats(
  projectId: string,
  account: string,
  indexerApi: IndexerMsI,
  eventDAL: EventStorage,
  statsStateDAL: StatsStateStorage,
  statsTimeSeriesDAL: StatsTimeSeriesStorage,
): Promise<AccountTimeSeriesStatsManager<LendingReserveStats>> {
  const reserveStatsAggregator =
    await ReserveStatsAggregatorFactory.getSingleton(projectId)

  const LendingTimeSeries = new TimeSeriesStats<LendingEvent, LendingInfo>(
    {
      type: 'lending',
      startDate: 0,
      timeFrames: [
        TimeFrame.Hour,
        TimeFrame.Day,
        TimeFrame.Week,
        TimeFrame.Month,
        TimeFrame.Year,
        TimeFrame.All,
      ],
      getInputStream: ({ account, startDate, endDate }) => {
        return eventDAL
          .useIndex(EventDALIndex.ReserveTimestamp)
          .getAllValuesFromTo([account, startDate], [account, endDate])
      },
      aggregate: ({ input, prevValue }): LendingInfo => {
        return lendingEventAggregator.aggregate(input, prevValue)
      },
    },
    statsStateDAL,
    statsTimeSeriesDAL,
  )

  const accountTimeSeries =
    new AccountTimeSeriesStatsManager<LendingReserveStats>(
      {
        account,
        series: [LendingTimeSeries],
        aggregate(args) {
          return reserveStatsAggregator.aggregate(args)
        },
      },
      indexerApi,
      statsStateDAL,
      statsTimeSeriesDAL,
    )

  return accountTimeSeries
}
