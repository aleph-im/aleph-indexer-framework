import {
  AccountTimeSeriesStatsManager, candleIntervalToDuration,
  IndexerMsI,
  StatsStateStorage,
  StatsTimeSeriesStorage,
  TimeSeriesStats,
} from '@aleph-indexer/framework'
import { PriceDALIndex, PriceStorage } from '../../dal/price.js'
import { Candle, Price } from '../../types.js'
import pythCandleAggregator from './CandleAggregator.js'
import { TIME_FRAMES } from '../../constants.js'
import { DateTime } from 'luxon'

export function createCandles(
  account: string,
  indexerApi: IndexerMsI,
  priceDAL: PriceStorage,
  statsStateDAL: StatsStateStorage,
  statsTimeSeriesDAL: StatsTimeSeriesStorage,
): AccountTimeSeriesStatsManager {
  const timeSeriesStats = new TimeSeriesStats<Price, Candle>(
    {
      type: 'candle',
      startDate: DateTime.fromMillis(0),
      timeFrames: TIME_FRAMES.map((tf) => candleIntervalToDuration(tf)),
      getInputStream: ({account, startDate, endDate}) => {
        return priceDAL
          .useIndex(PriceDALIndex.AccountTimestamp)
          .getAllValuesFromTo(
            [account, startDate.toMillis()],
            [account, endDate.toMillis()],
          )
      },
      aggregate: ({ input, prevValue }): Candle => {
        return pythCandleAggregator.aggregate(input, prevValue)
      },
    },
    statsStateDAL,
    statsTimeSeriesDAL,
  )

  return new AccountTimeSeriesStatsManager(
    {
      account,
      series: [timeSeriesStats],
    },
    indexerApi,
    statsStateDAL,
    statsTimeSeriesDAL,
  )
}
