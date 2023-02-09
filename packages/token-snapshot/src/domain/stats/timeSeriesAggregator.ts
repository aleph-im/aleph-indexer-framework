import BN from 'bn.js'
import {
  BorrowEvent,
  LiquidationEvent,
  LiquidityEvent,
  LendingEvent,
  LendingEventType,
  FlashLoanEvent, LendingBalance, LendingHolding,
} from '../../types.js'
import {
  borrowEventsWhitelist,
  flashLoanEventsWhitelist,
  liquidationEventsWhitelist,
  liquidityEventsWhitelist,
} from '../../constants.js'

export class LendingEventTimeSeriesAggregator {
  aggregate(curr: LendingEvent | LendingHolding, prev?: LendingHolding): LendingHolding {
    prev = this.prepareLendingInfoItem(prev)

    if (this.isLendingEvent(curr)) {
      if (this.isLiquidityEvent(curr)) {
        const info = this.prepareLiquidityInfo(curr)
        this.processLiquidityInfo(prev, info)
      }

      if (this.isBorrowEvent(curr)) {
        const info = this.prepareBorrowInfo(curr)
        this.processBorrowInfo(prev, info)
      }

      if (this.isLiquidationEvent(curr)) {
        const info = this.prepareLiquidationInfo(curr)
        this.processLiquidationInfo(prev, info)
      }

      if (this.isFlashLoanEvent(curr)) {
        const info = this.prepareFlashLoanInfo(curr)
        this.processFlashLoanInfo(prev, info)
      }
    } else {
      const info = this.prepareLendingInfoItem(curr)
      this.processLendingInfo(prev, info)
    }

    return prev
  }

  // @note: We assume that curr data is sorted by time
  protected processLendingInfo(
    acc: LendingHolding,
    curr: LendingHolding,
  ): LendingHolding {


    return acc
  }

  protected prepareLendingInfoItem(info?: LendingInfo): LendingInfo {
    info = info || {
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
      // totalBorrowed: new BN(0),
      // totalBorrowedUsd: new BN(0),
      borrowFees: new BN(0),
      borrowFeesUsd: new BN(0),
      totalBorrowFees: new BN(0),
      totalBorrowFeesUsd: new BN(0),

      liquidationsEventsVol: 0,
      liquidations: new BN(0),
      liquidationsUsd: new BN(0),
      totalLiquidations: new BN(0),
      totalLiquidationsUsd: new BN(0),
      // liquidationBonus: new BN(0),
      // liquidationBonusUsd: new BN(0),
      totalLiquidationBonus: new BN(0),
      totalLiquidationBonusUsd: new BN(0),

      flashLoanedEventsVol: 0,
      flashLoaned: new BN(0),
      flashLoanedUsd: new BN(0),
      // totalFlashLoaned: new BN(0),
      // totalFlashLoanedUsd: new BN(0),
      flashLoanFees: new BN(0),
      flashLoanFeesUsd: new BN(0),
      totalFlashLoanFees: new BN(0),
      totalFlashLoanFeesUsd: new BN(0),
    }

    if (typeof info.liquidityVol === 'string') {
      info.liquidityVol = new BN(info.liquidityVol, 'hex')
      info.liquidity = new BN(info.liquidity, 'hex')
      info.liquidityUsd = new BN(info.liquidityUsd, 'hex')
      info.totalLiquidity = new BN(info.totalLiquidity, 'hex')
      info.totalLiquidityUsd = new BN(info.totalLiquidityUsd, 'hex')
      info.borrowedVol = new BN(info.borrowedVol, 'hex')
      info.borrowed = new BN(info.borrowed, 'hex')
      info.borrowedUsd = new BN(info.borrowedUsd, 'hex')
      info.borrowFees = new BN(info.borrowFees, 'hex')
      info.borrowFeesUsd = new BN(info.borrowFeesUsd, 'hex')
      info.totalBorrowFees = new BN(info.totalBorrowFees, 'hex')
      info.totalBorrowFeesUsd = new BN(info.totalBorrowFeesUsd, 'hex')
      info.liquidations = new BN(info.liquidations, 'hex')
      info.liquidationsUsd = new BN(info.liquidationsUsd, 'hex')
      info.totalLiquidations = new BN(info.totalLiquidations, 'hex')
      info.totalLiquidationsUsd = new BN(info.totalLiquidationsUsd, 'hex')
      info.totalLiquidationBonus = new BN(info.totalLiquidationBonus, 'hex')
      info.totalLiquidationBonusUsd = new BN(
        info.totalLiquidationBonusUsd,
        'hex',
      )
      info.flashLoaned = new BN(info.flashLoaned, 'hex')
      info.flashLoanedUsd = new BN(info.flashLoanedUsd, 'hex')
      info.flashLoanFees = new BN(info.flashLoanFees, 'hex')
      info.flashLoanFeesUsd = new BN(info.flashLoanFeesUsd, 'hex')
      info.totalFlashLoanFees = new BN(info.totalFlashLoanFees, 'hex')
      info.totalFlashLoanFeesUsd = new BN(info.totalFlashLoanFeesUsd, 'hex')
    }

    return info
  }

  protected prepareLiquidityInfo(event: LiquidityEvent): LendingHolding {
    const mockZero = new BN(0)

    return {
      //@todo: implement aggregation
      //
    }
  }

  protected prepareBorrowInfo(event: BorrowEvent): BorrowInfo {
    const mockZero = new BN(0)

    const borrowedVol =
      event.type === LendingEventType.LiquidateObligation ||
      event.type === LendingEventType.LiquidateObligation2
        ? new BN(event.liquidityRepayAmount, 'hex')
        : new BN(event.liquidityAmount, 'hex')

    const borrowed =
      event.type === LendingEventType.BorrowObligationLiquidity
        ? borrowedVol
        : borrowedVol.neg()

    const borrowFees =
      event.type === LendingEventType.BorrowObligationLiquidity
        ? new BN(event.liquidityFeeAmount, 'hex')
        : new BN(0)

    return {
      borrowedEventsVol: 1,
      borrowedVol,
      borrowed,
      borrowedUsd: mockZero, // @todo
      borrowFees,
      borrowFeesUsd: mockZero, // @todo
      totalBorrowFees: mockZero, // @todo
      totalBorrowFeesUsd: mockZero, // @todo
    }
  }

  protected prepareLiquidationInfo(event: LiquidationEvent): LiquidationInfo {
    const mockZero = new BN(0)

    const liquidations = new BN(event.liquidityRepayAmount, 'hex')

    return {
      liquidationsEventsVol: 1,
      liquidations,
      liquidationsUsd: mockZero, // @todo
      totalLiquidations: mockZero, // @todo
      totalLiquidationsUsd: mockZero, // @todo
      totalLiquidationBonus: mockZero, // @todo
      totalLiquidationBonusUsd: mockZero, // @todo
    }
  }

  protected prepareFlashLoanInfo(event: FlashLoanEvent): FlashLoanInfo {
    const mockZero = new BN(0)

    const flashLoaned = new BN(event.liquidityAmount, 'hex')
    const flashLoanFees = new BN(event.liquidityFeeAmount, 'hex')

    return {
      flashLoanedEventsVol: 1,
      flashLoaned,
      flashLoanedUsd: mockZero, // @todo
      flashLoanFees,
      flashLoanFeesUsd: mockZero, // @todo
      totalFlashLoanFees: mockZero, // @todo
      totalFlashLoanFeesUsd: mockZero, // @todo
    }
  }

  protected isLendingEvent(
    event: LendingEvent | LendingInfo,
  ): event is LendingEvent {
    return 'type' in event
  }

  protected isLiquidityEvent(event: LendingEvent): event is LiquidityEvent {
    return liquidityEventsWhitelist.has(event.type)
  }

  protected isBorrowEvent(event: LendingEvent): event is BorrowEvent {
    return borrowEventsWhitelist.has(event.type)
  }

  protected isLiquidationEvent(event: LendingEvent): event is LiquidationEvent {
    return liquidationEventsWhitelist.has(event.type)
  }

  protected isFlashLoanEvent(event: LendingEvent): event is FlashLoanEvent {
    return flashLoanEventsWhitelist.has(event.type)
  }
}

export const lendingEventAggregator = new LendingEventTimeSeriesAggregator()
export default lendingEventAggregator
