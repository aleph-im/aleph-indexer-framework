import { DateTime } from 'luxon'
import BN from 'bn.js'
import { TimeFrame } from '@aleph-indexer/framework'
import {
  LendingInfo,
  LendingReserveStats,
  LendingReserveStatsFromContext,
} from '../../../../types.js'
import lendingEventAggregator from '../../timeSeriesAggregator.js'
import {
  LendingReserveStatsAggregator,
  LendingReserveStatsAggregatorArgs,
} from '../types.js'

export abstract class BaseLendingReserveStatsAggregator
  implements LendingReserveStatsAggregator
{
  protected abstract _aggregate(
    args: LendingReserveStatsAggregatorArgs,
  ): Promise<LendingReserveStatsFromContext>

  async aggregate(
    args: LendingReserveStatsAggregatorArgs,
  ): Promise<LendingReserveStats> {
    const { now, account, timeSeriesDAL } = args
    const contextStats = await this._aggregate(args)

    const stats = {
      ...this.getEmptyStats(),
      ...contextStats,
    }

    const type = 'lending'
    const currHour = DateTime.fromMillis(now).startOf('hour')
    const commonFields = [account, type, TimeFrame.Hour]

    const last1h = await timeSeriesDAL.get([
      ...commonFields,
      currHour.toMillis(),
    ])

    const last24hEvents = await timeSeriesDAL.getAllValuesFromTo(
      [...commonFields, currHour.minus({ hours: 24 }).toMillis()],
      [...commonFields, currHour.toMillis()],
    )

    let last24h
    for await (const event of last24hEvents) {
      last24h = lendingEventAggregator.aggregate(event.data, last24h)
    }

    const last7dEvents = await timeSeriesDAL.getAllValuesFromTo(
      [...commonFields, currHour.minus({ hours: 24 * 7 }).toMillis()],
      [...commonFields, currHour.toMillis()],
    )

    let last7d
    for await (const event of last7dEvents) {
      last7d = lendingEventAggregator.aggregate(event.data, last7d)
    }

    const total = await timeSeriesDAL.get([account, type, TimeFrame.All, 0])

    if (last1h) stats.last1h = last1h.data
    if (last24h) stats.last24h = last24h
    if (last7d) stats.last7d = last7d
    if (total) stats.total = total.data

    return stats
  }

  protected getEmptyStats(): LendingReserveStats {
    return {
      last1h: this.getEmptyLendingStats(),
      last24h: this.getEmptyLendingStats(),
      last7d: this.getEmptyLendingStats(),
      total: this.getEmptyLendingStats(),

      // CONTEXT
      ...this.getEmptyContextStats(),
    }
  }

  protected getEmptyLendingStats(): LendingInfo {
    return {
      liquidityEventsVol: 0,
      liquidityVol: new BN(0),
      liquidity: new BN(0),
      liquidityUsd: new BN(0),
      totalLiquidity: new BN(0),
      totalLiquidityUsd: new BN(0),

      borrowedEventsVol: 0,
      borrowedVol: new BN(0),
      borrowed: new BN(0),
      borrowedUsd: new BN(0),
      borrowFees: new BN(0),
      borrowFeesUsd: new BN(0),
      totalBorrowFees: new BN(0),
      totalBorrowFeesUsd: new BN(0),

      liquidationsEventsVol: 0,
      liquidations: new BN(0),
      liquidationsUsd: new BN(0),
      totalLiquidations: new BN(0),
      totalLiquidationsUsd: new BN(0),
      totalLiquidationBonus: new BN(0),
      totalLiquidationBonusUsd: new BN(0),

      flashLoanedEventsVol: 0,
      flashLoaned: new BN(0),
      flashLoanedUsd: new BN(0),
      flashLoanFees: new BN(0),
      flashLoanFeesUsd: new BN(0),
      totalFlashLoanFees: new BN(0),
      totalFlashLoanFeesUsd: new BN(0),
    }
  }

  protected getEmptyContextStats(): LendingReserveStatsFromContext {
    return {
      borrowApy: 0,
      supplyApy: 0,
      exchangeRatio: 0,
      utilizationRatio: 0,
      markPrice: 0,
      liquidityTotal: new BN(0),
      liquidityTotalUsd: new BN(0),
      totalDeposited: new BN(0),
      totalDepositedUsd: new BN(0),
      borrowedTotal: new BN(0),
      borrowedTotalUsd: new BN(0),
      flashLoanedTotal: new BN(0),
      flashLoanedTotalUsd: new BN(0),
    }
  }
}
