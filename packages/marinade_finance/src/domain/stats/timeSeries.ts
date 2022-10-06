import {
  AccountTimeSeriesStatsManager,
  IndexerMsI,
  StatsStateStorage,
  StatsTimeSeriesStorage,
  TimeFrame,
  TimeSeriesStats,
} from '@aleph-indexer/framework'
import { EventDALIndex, EventStorage } from '../../dal/event.js'
import { ParsedEvents, MarinadeFinanceInfo } from '../../types.js'
import statsAggregator from './statsAggregator.js'
import eventAggregator from './timeSeriesAggregator.js'

export async function createAccountStats(
  account: string,
  indexerApi: IndexerMsI,
  eventDAL: EventStorage,
  statsStateDAL: StatsStateStorage,
  statsTimeSeriesDAL: StatsTimeSeriesStorage,
): Promise<AccountTimeSeriesStatsManager> {
  const MarinadeFinanceTimeSeries = new TimeSeriesStats<
    ParsedEvents,
    MarinadeFinanceInfo
  >(
    {
      type: 'marinade_finance',
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
          .useIndex(EventDALIndex.AccoountTimestamp)
          .getAllValuesFromTo([account, startDate], [account, endDate])
      },
      aggregate: ({ input, prevValue }): MarinadeFinanceInfo => {
        return eventAggregator.aggregate(input, prevValue)
      },
    },
    statsStateDAL,
    statsTimeSeriesDAL,
  )

  const accountTimeSeries = new AccountTimeSeriesStatsManager(
    {
      account,
      series: [MarinadeFinanceTimeSeries],
      aggregate(args) {
        return statsAggregator.aggregate(args)
      },
    },
    indexerApi,
    statsStateDAL,
    statsTimeSeriesDAL,
  )

  return accountTimeSeries
}
