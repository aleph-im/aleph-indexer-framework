import { blob, struct, u64, u8 } from './_default.js'

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

// @note: https://github.com/solana-labs/solana-program-library/blob/master/token-lending/program/src/instruction.rs#L18
// @note: Exclude not significant events from being indexed:
export const SPL_TOKEN_LENDING_IX_METHOD_CODE: Record<
  string,
  LendingEventType | undefined
> = {
  // [0]: LendingEventType.InitLendingMarket,
  // [1]: LendingEventType.SetLendingMarketOwner,
  [2]: LendingEventType.InitReserve,
  // [3]: LendingEventType.RefreshReserve,
  [4]: LendingEventType.DepositReserveLiquidity,
  [5]: LendingEventType.RedeemReserveCollateral,
  // [6]: LendingEventType.InitObligation,
  // [7]: LendingEventType.RefreshObligation,
  [8]: LendingEventType.DepositObligationCollateral,
  [9]: LendingEventType.WithdrawObligationCollateral,
  [10]: LendingEventType.BorrowObligationLiquidity,
  [11]: LendingEventType.RepayObligationLiquidity,
  [12]: LendingEventType.LiquidateObligation,
  [13]: LendingEventType.FlashLoan,
}

export const SPL_TOKEN_LENDING_IX_DATA_LAYOUT: Partial<
  Record<LendingEventType, any>
> = {
  [LendingEventType.InitLendingMarket]: struct([
    u8('instruction'),
    blob(32, 'owner'),
    blob(32, 'quoteCurrency'),
  ]),
  [LendingEventType.SetLendingMarketOwner]: struct([
    u8('instruction'),
    blob(32, 'newOwner'),
  ]),
  [LendingEventType.InitReserve]: struct([
    u8('instruction'),
    u64('liquidityAmount'),
    blob(24, 'config'),
  ]),
  [LendingEventType.RefreshReserve]: struct([u8('instruction')]),
  [LendingEventType.DepositReserveLiquidity]: struct([
    u8('instruction'),
    u64('liquidityAmount'),
  ]),
  [LendingEventType.RedeemReserveCollateral]: struct([
    u8('instruction'),
    u64('collateralAmount'),
  ]),
  [LendingEventType.InitObligation]: struct([u8('instruction')]),
  [LendingEventType.RefreshObligation]: struct([u8('instruction')]),
  [LendingEventType.DepositObligationCollateral]: struct([
    u8('instruction'),
    u64('collateralAmount'),
  ]),
  [LendingEventType.WithdrawObligationCollateral]: struct([
    u8('instruction'),
    u64('collateralAmount'),
  ]),
  [LendingEventType.BorrowObligationLiquidity]: struct([
    u8('instruction'),
    u64('liquidityAmount'),
  ]),
  [LendingEventType.RepayObligationLiquidity]: struct([
    u8('instruction'),
    u64('liquidityAmount'),
  ]),
  [LendingEventType.LiquidateObligation]: struct([
    u8('instruction'),
    u64('liquidityAmount'),
  ]),
  [LendingEventType.FlashLoan]: struct([
    u8('instruction'),
    u64('liquidityAmount'),
  ]),
}
