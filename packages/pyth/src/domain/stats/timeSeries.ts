import {
  AccountTimeSeriesStatsManager,
  Blockchain,
  IndexableEntityType,
  IndexerMsClient,
  StatsStateStorage,
  StatsTimeSeriesStorage,
  TimeFrame,
  TimeSeriesStats,
} from '@aleph-indexer/framework'
import { PriceDALIndex, PriceStorage } from '../../dal/price.js'
import { Candle, Price, PythAccountStats } from '../../types.js'
import pythCandleAggregator from './candleAggregator.js'
import statsAggregator from './statsAggregator.js'

export function createCandles(
  projectId: string,
  blockchainId: Blockchain,
  account: string,
  indexerApi: IndexerMsClient,
  priceDAL: PriceStorage,
  statsStateDAL: StatsStateStorage,
  statsTimeSeriesDAL: StatsTimeSeriesStorage,
): AccountTimeSeriesStatsManager<PythAccountStats> {
  const timeSeriesStats = new TimeSeriesStats<Price, Candle>(
    {
      type: 'candle',
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
        return priceDAL
          .useIndex(PriceDALIndex.AccountTimestamp)
          .getAllValuesFromTo(
            [account, startDate],
            [account, endDate],
          )
      },
      aggregate: ({ input, prevValue }): Candle => {
        return pythCandleAggregator.aggregate(input, prevValue)
      },
    },
    statsStateDAL,
    statsTimeSeriesDAL,
  )

  return new AccountTimeSeriesStatsManager<PythAccountStats>(
    {
      blockchainId,
      type: IndexableEntityType.Transaction,
      account,
      series: [timeSeriesStats],
      aggregate(args) {
        return statsAggregator.aggregate(args)
      },
    },
    indexerApi,
    statsStateDAL,
    statsTimeSeriesDAL,
  )
}
