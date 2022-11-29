import {
  AccountTimeSeriesStatsManager,
  IndexerMsI,
  StatsStateStorage,
  StatsTimeSeriesStorage,
  TimeSeriesStats,
} from '@aleph-indexer/framework'
import { PriceDALIndex, PriceStorage } from '../../dal/price.js'
import {Candle, DataFeedStats, Price} from '../../types.js'
import pythCandleAggregator from './candleAggregator.js'
import { TIME_FRAMES_AS_DURATION } from '../../constants.js'
import statsAggregator from "./statsAggregator.js";

export function createCandles(
  account: string,
  indexerApi: IndexerMsI,
  priceDAL: PriceStorage,
  statsStateDAL: StatsStateStorage,
  statsTimeSeriesDAL: StatsTimeSeriesStorage,
): AccountTimeSeriesStatsManager<DataFeedStats> {
  const timeSeriesStats = new TimeSeriesStats<Price, Candle>(
    {
      type: 'candle',
      startTimestamp: 0,
      timeFrames: TIME_FRAMES_AS_DURATION,
      getInputStream: ({account, startTimestamp, endTimestamp}) => {
        return priceDAL
          .useIndex(PriceDALIndex.AccountTimestamp)
          .getAllValuesFromTo(
            [account, startTimestamp],
            [account, endTimestamp],
          )
      },
      aggregate: ({ input, prevValue }): Candle => {
        return pythCandleAggregator.aggregate(input, prevValue)
      },
    },
    statsStateDAL,
    statsTimeSeriesDAL,
  )

  return new AccountTimeSeriesStatsManager<DataFeedStats>(
    {
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
