import BN from 'bn.js'
import { TokenInfo } from '@solana/spl-token-registry'
import { EventBase } from '@aleph-indexer/core'

export enum LendingEventType {
  InitLendingMarket = 'initLendingMarket',
  SetLendingMarketOwner = 'setLendingMarketOwner',
  InitReserve = 'initReserve',
  RefreshReserve = 'refreshReserve',
  DepositReserveLiquidity = 'depositReserveLiquidity',
  RedeemReserveCollateral = 'redeemReserveCollateral',
  InitObligation = 'initObligation',
  RefreshObligation = 'refreshObligation',
  DepositObligationCollateral = 'depositObligationCollateral',
  WithdrawObligationCollateral = 'withdrawObligationCollateral',
  BorrowObligationLiquidity = 'borrowObligationLiquidity',
  RepayObligationLiquidity = 'repayObligationLiquidity',
  LiquidateObligation = 'liquidateObligation',
  FlashLoan = 'flashLoan',
  DepositReserveLiquidityAndObligationCollateral = 'depositReserveLiquidityAndObligationCollateral',
  WithdrawObligationCollateralAndRedeemReserveCollateral = 'withdrawObligationCollateralAndRedeemReserveCollateral',
  UpdateReserveConfig = 'updateReserveConfig', // Admin tx for update reserve account data
  Unknown16 = 'unknown-16', // Admin tx for update reserve account data
  Unknown18 = 'unknown-18', // Admin tx for update reserve account data

  // @note: adhoc latrix
  LiquidateObligation2 = 'liquidateObligation2',
}

/**
 * @note: Exclude not significant events from being indexed:
 * [0]: PortEventType.InitLendingMarket,
 * [1]: PortEventType.SetLendingMarketOwner,
 * [3]: PortEventType.RefreshReserve,
 * [6]: PortEventType.InitObligation,
 * [7]: PortEventType.RefreshObligation,
 * [13]: PortEventType.Unknown13,
 * [15]: PortEventType.Unknown15,
 * [16]: PortEventType.Unknown16, // Admin ix for updating reserve account data
 * [17]: PortEventType.Unknown17,
 * [18]: PortEventType.Unknown18, // Admin ix for updating reserve account data
 * */
export type LendingEvent =
  | InitReserveEvent
  | DepositReserveLiquidityEvent
  | RedeemReserveCollateralEvent
  | DepositObligationCollateralEvent
  | WithdrawObligationCollateralEvent
  | BorrowObligationLiquidityEvent
  | RepayObligationLiquidityEvent
  | LiquidateObligationEvent
  | FlashLoanEvent
  | DepositReserveLiquidityAndObligationCollateralEvent
  | WithdrawObligationCollateralAndRedeemReserveCollateralEvent
  | LiquidateObligation2Event

export type LiquidityEvent =
  | DepositReserveLiquidityEvent
  | RedeemReserveCollateralEvent
  | BorrowObligationLiquidityEvent
  | RepayObligationLiquidityEvent
  | LiquidateObligationEvent
  | FlashLoanEvent
  | DepositReserveLiquidityAndObligationCollateralEvent
  | WithdrawObligationCollateralAndRedeemReserveCollateralEvent
  | LiquidateObligation2Event

export type BorrowEvent =
  | BorrowObligationLiquidityEvent
  | RepayObligationLiquidityEvent
  | LiquidateObligationEvent
  | LiquidateObligation2Event

export type LiquidationEvent =
  | LiquidateObligationEvent
  | LiquidateObligation2Event

export type LendingEventInfo =
  | InitReserveEventInfo
  | DepositReserveLiquidityEventInfo
  | RedeemReserveCollateralEventInfo
  | DepositObligationCollateralEventInfo
  | WithdrawObligationCollateralEventInfo
  | BorrowObligationLiquidityEventInfo
  | RepayObligationLiquidityEventInfo
  | LiquidateObligationEventInfo
  | FlashLoanEventInfo
  | DepositReserveLiquidityAndObligationCollateralEventInfo
  | WithdrawObligationCollateralAndRedeemReserveCollateralEventInfo
  | LiquidateObligation2EventInfo

export type LendingEventBase = EventBase<LendingEventType>

export type InitReserveEventInfo = {
  liquidity?: string
  collateral?: string
  reserve: string
  reserveLiquidityMint: string
  reserveLiquidityVault: string
  liquidityFeeReceiver: string
  reserveCollateralMint: string
  reserveCollateralVault: string
  lendingMarket: string
  lendingMarketAuthority?: string
  lendingMarketOwner: string
  transferAuthority?: string
  clockProgram: string
  rentProgram: string
  tokenProgram: string
  pythPriceOracle?: string
  switchboardFeedAddress?: string
}

export type InitReserveEvent = LendingEventBase &
  InitReserveEventInfo & {
    type: LendingEventType.InitReserve
  }

export type DepositReserveLiquidityEventInfo = {
  liquidityAmount: BN
  userLiquidity: string
  userCollateral: string
  reserve: string
  reserveLiquidityVault: string
  reserveCollateralMint: string
  lendingMarket: string
  lendingMarketAuthority: string
  transferAuthority: string
  clockProgram: string
  tokenProgram: string
}

export type DepositReserveLiquidityEvent = LendingEventBase &
  DepositReserveLiquidityEventInfo & {
    type: LendingEventType.DepositReserveLiquidity
    collateralAmount: BN // from spl-token ix
    reserveLiquidityAmount: BN
  }

export type DepositObligationCollateralEventInfo = {
  collateralAmount: BN
  userCollateral: string
  reserveCollateralVault: string
  reserve: string
  obligation: string
  lendingMarket: string
  lendingMarketAuthority?: string
  obligationOwner: string
  transferAuthority: string
  clockProgram: string
  tokenProgram: string
  stakeAccount?: string
  stakingPool?: string
  stakingProgram?: string
}

export type DepositObligationCollateralEvent = LendingEventBase &
  DepositObligationCollateralEventInfo & {
    type: LendingEventType.DepositObligationCollateral
  }

export type RedeemReserveCollateralEventInfo = {
  collateralAmount: BN
  userCollateral: string
  userLiquidity: string
  reserve: string
  reserveCollateralMint: string
  reserveLiquidityVault: string
  lendingMarket: string
  lendingMarketAuthority: string
  transferAuthority: string
  clockProgram: string
  tokenProgram: string
  stakeAccount?: string
  stakingPool?: string
  stakingProgram?: string
}

export type RedeemReserveCollateralEvent = LendingEventBase &
  RedeemReserveCollateralEventInfo & {
    type: LendingEventType.RedeemReserveCollateral
    liquidityAmount: BN // from spl-token ix
    reserveLiquidityAmount: BN
  }

export type WithdrawObligationCollateralEventInfo = {
  collateralAmount: BN
  reserveCollateralVault: string
  userCollateral: string
  reserve: string
  obligation: string
  lendingMarket: string
  lendingMarketAuthority: string
  obligationOwner: string
  clockProgram: string
  tokenProgram: string
  stakeAccount?: string
  stakingPool?: string
  stakingProgram?: string
}

export type WithdrawObligationCollateralEvent = LendingEventBase &
  WithdrawObligationCollateralEventInfo & {
    type: LendingEventType.WithdrawObligationCollateral
  }

export type BorrowObligationLiquidityEventInfo = {
  liquidityAmount: BN
  reserveLiquidityVault: string
  userLiquidity: string
  reserve: string
  liquidityFeeReceiver: string
  obligation: string
  lendingMarket: string
  lendingMarketAuthority: string
  obligationOwner: string
  clockProgram: string
  tokenProgram: string
}

export type BorrowObligationLiquidityEvent = LendingEventBase &
  BorrowObligationLiquidityEventInfo & {
    type: LendingEventType.BorrowObligationLiquidity
    // @note: fee is 0.0001 of liquidityAmount
    liquidityFeeAmount: BN
    reserveLiquidityAmount: BN
  }

export type RepayObligationLiquidityEventInfo = {
  liquidityAmount: BN
  userLiquidity: string
  reserveLiquidityVault: string
  reserve: string
  obligation: string
  lendingMarket: string
  transferAuthority: string
  clockProgram: string
  tokenProgram: string
}

export type RepayObligationLiquidityEvent = LendingEventBase &
  RepayObligationLiquidityEventInfo & {
    type: LendingEventType.RepayObligationLiquidity
    reserveLiquidityAmount: BN
  }

export type LiquidateObligationEventInfo = {
  liquidityAmount: BN
  userLiquidity: string
  userCollateral: string
  repayReserve: string
  repayReserveLiquidityVault: string
  withdrawReserve: string
  withdrawReserveCollateralVault: string
  obligation: string
  lendingMarket: string
  lendingMarketAuthority: string
  transferAuthority: string
  clockProgram: string
  tokenProgram: string
  stakeAccount?: string
  stakingPool?: string
  stakingProgram?: string
}

export type LiquidateObligationEvent = LendingEventBase &
  LiquidateObligationEventInfo & {
    type: LendingEventType.LiquidateObligation
    liquidityRepayAmount: BN
    collateralWithdrawAmount: BN
    repayReserveLiquidityAmount: BN
  }

export type FlashLoanEventInfo = {
  liquidityAmount: BN
  reserveLiquidityVault: string
  userLiquidity: string
  reserve: string
  liquidityFeeReceiver: string
  hostFeeReceiver: string
  lendingMarket: string
  lendingMarketAuthority: string
  tokenProgram: string
  flashLoanReceiverProgram: string
  flashLoanReceiverAddresses: string[]
}

export type FlashLoanEvent = LendingEventBase &
  FlashLoanEventInfo & {
    type: LendingEventType.FlashLoan
    // @note: fee is 0.0001 of liquidityAmount
    liquidityFeeAmount: BN
    reserveLiquidityAmount: BN
  }

export type DepositReserveLiquidityAndObligationCollateralEventInfo = {
  liquidityAmount: BN
  userLiquidity: string
  userCollateral: string
  reserve: string
  reserveLiquidityVault: string
  reserveCollateralMint: string
  lendingMarket: string
  lendingMarketAuthority: string
  reserveCollateralVault: string
  obligation: string
  obligationOwner: string
  pythPriceOracle?: string
  switchboardFeedAddress?: string
  transferAuthority: string
  clockProgram: string
  tokenProgram: string
  stakeAccount?: string
  stakingPool?: string
  stakingProgram?: string
}

export type DepositReserveLiquidityAndObligationCollateralEvent =
  LendingEventBase &
    DepositReserveLiquidityAndObligationCollateralEventInfo & {
      type: LendingEventType.DepositReserveLiquidityAndObligationCollateral
      collateralAmount: BN // from spl-token ix
      reserveLiquidityAmount: BN
    }

export type WithdrawObligationCollateralAndRedeemReserveCollateralEventInfo = {
  collateralAmount: BN
  reserveCollateralVault: string
  userCollateral: string
  reserve: string
  obligation: string
  lendingMarket: string
  lendingMarketAuthority: string
  userLiquidity: string
  reserveCollateralMint: string
  reserveLiquidityVault: string
  obligationOwner: string
  transferAuthority: string
  clockProgram: string
  tokenProgram: string
}

export type WithdrawObligationCollateralAndRedeemReserveCollateralEvent =
  LendingEventBase &
    WithdrawObligationCollateralAndRedeemReserveCollateralEventInfo & {
      type: LendingEventType.WithdrawObligationCollateralAndRedeemReserveCollateral
      liquidityAmount: BN
      reserveLiquidityAmount: BN
    }

export type LiquidateObligation2EventInfo = Omit<
  LiquidateObligationEventInfo,
  'clockProgram'
>

export type LiquidateObligation2Event = LendingEventBase &
  LiquidateObligation2EventInfo & {
    type: LendingEventType.LiquidateObligation2
    liquidityRepayAmount: BN
    collateralWithdrawAmount: BN
    repayReserveLiquidityAmount: BN
  }

// -------------- RESERVE INFO -------------------

export type LendingReserveInfo = {
  name: string
  address: string
  version: number
  lendingMarketAddress: string
  liquidityToken: TokenInfo
  collateralToken: TokenInfo
  reserveLiquidityVault: string
  reserveCollateralVault: string
  liquidityFeeReceiver: string
  quantityMultiplier: string
  quantityDecimals: number
  loanToValueRatio: number
  optimalUtilizationRatio: number
  optimalBorrowRate: number
  minBorrowRate: number
  maxBorrowRate: number
  liquidationThreshold: number
  liquidationPenalty: number

  pythPriceOracle?: string
  switchboardFeedAddress?: string
  assetPrice?: number
  collateralExchangeRate?: number
  depositLimit?: BN
  stakingPool?: string
  borrowInterestAPY?: number
  borrowFeePercentage?: number
}

// -------------- STATS -------------------

export type LiquidityInfo = {
  // @note: number of events
  liquidityEventsVol: number
  // @note: all volume = deposits + withdrawals
  liquidityVol: BN
  // @note: +deposited / -withdrawn
  liquidity: BN
  liquidityUsd: BN
  // @note: accumulated (from the beginning)
  totalLiquidity: BN
  totalLiquidityUsd: BN
}

export type BorrowInfo = {
  // @note: number of events
  borrowedEventsVol: number
  // @note: all volume = borrows + repays
  borrowedVol: BN
  // @note: +borrowed / -repaid
  borrowed: BN
  borrowedUsd: BN
  // @note: accumulated (from the beginning)
  borrowFees: BN
  borrowFeesUsd: BN
  // @note: accumulated fees (from the beginning)
  totalBorrowFees: BN
  totalBorrowFeesUsd: BN
}

export type LiquidationInfo = {
  // @note: number of events
  liquidationsEventsVol: number
  // @note: repaid loans
  liquidations: BN
  liquidationsUsd: BN
  // @note: accumulated (from the beginning)
  totalLiquidations: BN
  totalLiquidationsUsd: BN
  // @note: accumulated bonus (from the beginning)
  totalLiquidationBonus: BN
  totalLiquidationBonusUsd: BN
}

export type FlashLoanInfo = {
  // @note: number of events
  flashLoanedEventsVol: number
  // @note: all volume = borrows + repays
  flashLoaned: BN
  flashLoanedUsd: BN
  // @note: accumulated (from the beginning)
  flashLoanFees: BN
  flashLoanFeesUsd: BN
  // @note: accumulated fees (from the beginning)
  totalFlashLoanFees: BN
  totalFlashLoanFeesUsd: BN
}

export type LendingInfo = LiquidityInfo &
  BorrowInfo &
  LiquidationInfo &
  FlashLoanInfo

export type LendingReserveStatsFromContext = {
  borrowApy: number
  supplyApy: number
  exchangeRatio: number
  utilizationRatio: number
  markPrice: number

  liquidityTotal: BN
  liquidityTotalUsd: BN

  totalDeposited: BN
  totalDepositedUsd: BN

  borrowedTotal: BN
  borrowedTotalUsd: BN

  flashLoanedTotal: BN
  flashLoanedTotalUsd: BN
}

export type LendingReserveStats = {
  last1h: LendingInfo
  last24h: LendingInfo
  last7d: LendingInfo
  total: LendingInfo
} & LendingReserveStatsFromContext

export type GlobalLendingStats = {
  liquidityTotalUsd: BN
  borrowedTotalUsd: BN
  totalDepositedUsd: BN
  quantityDecimals: number
  flashLoanedTotalUsd: BN
}

export type ReserveData = {
  info: LendingReserveInfo
  stats?: LendingReserveStats
}
