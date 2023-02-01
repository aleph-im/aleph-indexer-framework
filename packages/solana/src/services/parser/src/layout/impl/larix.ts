import { LARIX_PROGRAM_ID } from '../layoutHub.js'
import { struct, u64, u8 } from './_default.js'
import { LayoutImplementation } from '../types.js'
import {
  SPL_TOKEN_LENDING_IX_DATA_LAYOUT,
  SPL_TOKEN_LENDING_IX_METHOD_CODE,
  LendingEventType,
} from './_lending.js'

// @note: https://github.com/ProjectLarix/larix-lending/blob/master/src/instruction.rs#L25
export const LARIX_IX_METHOD_CODE: Record<
  string,
  LendingEventType | undefined
> = {
  ...SPL_TOKEN_LENDING_IX_METHOD_CODE,
  // [14]: LendingEventType.SetConfig,
  // [16]: LendingEventType.InitMining,
  // [17]: LendingEventType.RefreshMining,
  // [18]: LendingEventType.DepositMining,
  // [19]: LendingEventType.WithdrawMining,
  // [20]: LendingEventType.ClaimMiningMine,
  // [21]: LendingEventType.ClaimObligationMine,
  // [22]: LendingEventType.ClaimOwnerFee,
  // [23]: LendingEventType.ReceivePendingOwner,
  // [24]: LendingEventType.RefreshReserves,
  [25]: LendingEventType.LiquidateObligation2,
  // [26]: LendingEventType.ClaimMine,
}

export const LARIX_IX_DATA_LAYOUT: Partial<Record<LendingEventType, any>> = {
  ...SPL_TOKEN_LENDING_IX_DATA_LAYOUT,
  [LendingEventType.InitReserve]: struct([
    u8('instruction'),
    u64('totalMiningSpeed'),
    u64('kinkUtilRate'),
  ]),
  [LendingEventType.LiquidateObligation2]: struct([
    u8('instruction'),
    u64('liquidityAmount'),
  ]),
}

export const LARIX_ACCOUNT_LAYOUT: Partial<Record<LendingEventType, any>> = {
  [LendingEventType.InitReserve]: [
    'reserve',
    'reserveLiquidityMint',
    'reserveLiquidityVault',
    'liquidityFeeReceiver',
    'pythProduct', // filtered
    'pythPriceOracleOrBridgePool', // filtered
    'larixOracleOrBridgeProgram', // filtered
    'reserveCollateralMint',
    'reserveCollateralVault',
    'lendingMarket',
    'lendingMarketOwner',
    'UnCollSupplyAccount', // filtered
    'clockProgram',
    'rentProgram',
    'tokenProgram',
  ],
  [LendingEventType.DepositReserveLiquidity]: [
    'userLiquidity',
    'userCollateral',
    'reserve',
    'reserveCollateralMint',
    'reserveLiquidityVault',
    'lendingMarket',
    'lendingMarketAuthority',
    'transferAuthority',
    'tokenProgram',
  ],
  [LendingEventType.RedeemReserveCollateral]: [
    'userCollateral',
    'reserve',
    'reserveCollateralMint',
    'reserveLiquidityVault',
    'lendingMarket',
    'lendingMarketAuthority',
    'transferAuthority',
    'tokenProgram',
    'userLiquidity',
    'bridgePool', // filtered
    'bridgeProgram', // filtered
    'bridgeWithdrawalPool', // filtered
  ],
  [LendingEventType.DepositObligationCollateral]: [
    'userCollateral',
    'reserveCollateralVault',
    'reserve',
    'obligation',
    'lendingMarket',
    'lendingMarketAuthority',
    'obligationOwner',
    'transferAuthority',
    'tokenProgram',
  ],
  [LendingEventType.WithdrawObligationCollateral]: [
    'userCollateral', // ??
    'reserveCollateralVault', // ??
    'reserve',
    'obligation',
    'lendingMarket',
    'lendingMarketAuthority',
    'obligationOwner',
    'tokenProgram',
  ],
  [LendingEventType.BorrowObligationLiquidity]: [
    'reserveLiquidityVault',
    'userLiquidity',
    'reserve',
    'obligation',
    'lendingMarket',
    'lendingMarketAuthority',
    'obligationOwner',
    'tokenProgram',
    'liquidityFeeReceiver',
    'larixOracle', // filtered
    'mineMint', // filtered
  ],
  [LendingEventType.RepayObligationLiquidity]: [
    'userLiquidity',
    'reserveLiquidityVault',
    'reserve',
    'obligation',
    'lendingMarket',
    'transferAuthority',
    'tokenProgram',
  ],
  [LendingEventType.LiquidateObligation]: [
    'userLiquidity',
    'userCollateral',
    'repayReserve',
    'repayReserveLiquidityVault',
    'withdrawReserve',
    'withdrawReserveCollateralVault',
    'obligation',
    'lendingMarket',
    'lendingMarketAuthority',
    'transferAuthority',
    'clockProgram',
    'tokenProgram',
  ],
  [LendingEventType.FlashLoan]: [
    'reserveLiquidityVault',
    'userLiquidity',
    'reserve',
    'liquidityFeeReceiver',
    'hostFeeReceiver',
    'lendingMarket',
    'lendingMarketAuthority',
    'tokenProgram',
    'flashLoanReceiverProgram',
    'flashLoanAuthority',
    ['flashLoanReceiverAddresses'],
  ],
  [LendingEventType.LiquidateObligation2]: [
    'userLiquidity',
    'userCollateral',
    'repayReserve',
    'repayReserveLiquidityVault',
    'withdrawReserve',
    'withdrawReserveCollateralVault',
    'obligation',
    'lendingMarket',
    'lendingMarketAuthority',
    'transferAuthority',
    'tokenProgram',
  ],
}

export const LARIX_ACCOUNT_DATA_LAYOUT = struct<any>([
  u8('instruction'),
  u64('totalMiningSpeed'),
  u64('kinkUtilRate'),
])

export default class implements LayoutImplementation {
  name = 'larix'
  programID = LARIX_PROGRAM_ID
  accountLayoutMap = LARIX_ACCOUNT_LAYOUT
  dataLayoutMap = LARIX_IX_DATA_LAYOUT
  accountDataLayoutMap = LARIX_ACCOUNT_DATA_LAYOUT
  eventType = LendingEventType

  getInstructionType(data: Buffer): LendingEventType | undefined {
    const method = data.slice(0, 1).readUInt8()
    return LARIX_IX_METHOD_CODE[method]
  }
}
