import BN from 'bn.js'
import { Port, ReserveId } from '@port.finance/port-sdk'
import { usdWad } from '../../../../constants.js'
import { BaseLendingReserveStatsAggregator } from './base.js'
import { PORT_SDK } from '../../../../utils/port-sdk.js'
import { LendingReserveStatsFromContext } from '../../../../types.js'
import {
  LendingReserveStatsAggregator,
  LendingReserveStatsAggregatorArgs,
} from '../types.js'

export default class PortReserveStatsAggregator
  extends BaseLendingReserveStatsAggregator
  implements LendingReserveStatsAggregator
{
  constructor(protected sdk: Port = PORT_SDK) {
    super()
  }

  protected async _aggregate({
    account,
  }: LendingReserveStatsAggregatorArgs): Promise<LendingReserveStatsFromContext> {
    const context = await this.sdk.getReserveContext()
    const reserve = context.getReserve(ReserveId.fromBase58(account))

    const stats = this.getEmptyContextStats()

    stats.borrowApy = reserve
      .getBorrowApy()
      .getPct()
      ?.toOneBasedNumber(4) as number

    stats.supplyApy = reserve
      .getSupplyApy()
      .getPct()
      ?.toOneBasedNumber(4) as number

    stats.exchangeRatio = reserve
      .getExchangeRatio()
      .getPct()
      ?.toOneBasedNumber(4) as number

    stats.utilizationRatio = reserve
      .getUtilizationRatio()
      .getPct()
      ?.toOneBasedNumber(4) as number

    stats.markPrice = reserve.getMarkPrice().getRaw().toNumber()

    stats.liquidityTotal = new BN(
      reserve.getAvailableAsset().getRaw().toFixed(0),
    )
    stats.liquidityTotalUsd = new BN(
      reserve.getAvailableAssetValue().getValue().getRaw().toFixed(0),
    ).mul(usdWad)

    stats.totalDeposited = new BN(reserve.getTotalAsset().getRaw().toFixed(0))
    stats.totalDepositedUsd = new BN(
      reserve.getMarketCap().getValue().getRaw().toFixed(0),
    ).mul(usdWad)

    stats.borrowedTotal = new BN(reserve.getBorrowedAsset().getRaw().toFixed(0))
    stats.borrowedTotalUsd = new BN(
      reserve.getBorrowedAssetValue().getValue().getRaw().toFixed(0),
    ).mul(usdWad)

    return stats
  }
}
