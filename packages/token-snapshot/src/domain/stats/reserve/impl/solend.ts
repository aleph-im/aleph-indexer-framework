import BN from 'bn.js'
import { SolendReserve } from '@solendprotocol/solend-sdk'
import { SOLEND_SDK } from '../../../../utils/solend-sdk.js'
import { usdWad, WAD } from '../../../../constants.js'
import { BaseLendingReserveStatsAggregator } from './base.js'
import { LendingReserveStatsFromContext } from '../../../../types.js'
import {
  LendingReserveStatsAggregator,
  LendingReserveStatsAggregatorArgs,
} from '../types.js'

export default class SolendReserveStatsAggregator
  extends BaseLendingReserveStatsAggregator
  implements LendingReserveStatsAggregator
{
  constructor(protected sdk = SOLEND_SDK) {
    super()
  }

  protected async _aggregate({
    account,
  }: LendingReserveStatsAggregatorArgs): Promise<LendingReserveStatsFromContext> {
    const context = await this.loadReserve(account)
    const quantityDecimals = context.config.liquidityToken.decimals
    const precisionFactor = new BN(10 ** quantityDecimals)

    const stats = this.getEmptyContextStats()

    stats.markPrice = context.stats?.assetPriceUSD as number

    stats.borrowApy = context.stats?.borrowInterestAPY as number
    stats.supplyApy = context.stats?.supplyInterestAPY as number

    stats.exchangeRatio = context.stats?.cTokenExchangeRate as number

    stats.liquidityTotal = context.stats?.totalLiquidityWads.div(WAD) as BN
    stats.liquidityTotalUsd = this.toUSD(
      stats.liquidityTotal,
      stats.markPrice,
      precisionFactor,
    )

    stats.borrowedTotal = context.stats?.totalBorrowsWads.div(WAD) as BN
    stats.borrowedTotalUsd = this.toUSD(
      stats.borrowedTotal,
      stats.markPrice,
      precisionFactor,
    )

    stats.totalDeposited = context.stats?.totalDepositsWads.div(WAD) as BN
    stats.totalDepositedUsd = this.toUSD(
      stats.totalDeposited,
      stats.markPrice,
      precisionFactor,
    )

    stats.utilizationRatio =
      stats.borrowedTotal.div(precisionFactor).toNumber() /
      stats.totalDeposited.div(precisionFactor).toNumber()

    return stats
  }

  // @note: Also converts down to USD accuracy, if needed.
  protected toUSD(amount: BN, price: number, amountFactor: BN): BN {
    return new BN(
      amount.mul(new BN(price * usdWad.toNumber())).div(amountFactor),
    )
  }

  protected async loadReserve(address: string): Promise<SolendReserve> {
    const reserve = this.sdk.reserves.find(
      (reserve: SolendReserve) => reserve.config.address === address,
    ) as SolendReserve
    reserve.setBuffer(null) // force refresh
    await reserve.load()
    return reserve
  }
}
