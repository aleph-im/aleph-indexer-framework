import {
  AccountTimeSeriesStatsManager,
  Blockchain,
  IndexerMsClient,
  StatsStateStorage,
  StatsTimeSeriesStorage,
  TimeSeriesStats,
} from '@aleph-indexer/framework'
import { PriceDALIndex, PriceStorage } from '../../dal/price.js'
import { Candle, PythAccountStats, Price } from '../../types.js'
import pythCandleAggregator from './candleAggregator.js'
import { TIME_FRAMES_AS_DURATION } from '../../constants.js'
import statsAggregator from './statsAggregator.js'

export function createCandles(
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
      timeFrames: TIME_FRAMES_AS_DURATION,
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
