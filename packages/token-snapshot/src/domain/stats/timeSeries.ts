import {
  AccountTimeSeriesStatsManager,
  Blockchain,
  IndexableEntityType,
  IndexerMsClient,
  TimeSeriesStateStorage,
  TimeSeriesStatsStorage,
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
  indexerApi: IndexerMsClient,
  eventDAL: EventStorage,
  stateDAL: TimeSeriesStateStorage,
  statsDAL: TimeSeriesStatsStorage,
): Promise<AccountTimeSeriesStatsManager<LendingReserveStats>> {
  const reserveStatsAggregator =
    await ReserveStatsAggregatorFactory.getSingleton(projectId)

  const LendingTimeSeries = new TimeSeriesStats<LendingEvent, LendingInfo>(
    {
      type: 'lending',
      beginStatsDate: 0,
      timeFrames: [
        TimeFrame.Tick,
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
    stateDAL,
    statsDAL,
  )

  const accountTimeSeries =
    new AccountTimeSeriesStatsManager<LendingReserveStats>(
      {
        account,
        blockchainId: Blockchain.Solana,
        type: IndexableEntityType.Transaction,
        series: [LendingTimeSeries],
        aggregate(args) {
          return reserveStatsAggregator.aggregate(args)
        },
      },
      indexerApi,
      stateDAL,
      statsDAL,
    )

  return accountTimeSeries
}
