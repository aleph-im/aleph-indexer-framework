import { SOLEND_PROGRAM_ID } from '../layoutHub.js'
import { blob, struct, u64, u8 } from '@aleph-indexer/layout'
import { LayoutImplementation } from '../types.js'
import {
  SPL_TOKEN_LENDING_IX_DATA_LAYOUT,
  SPL_TOKEN_LENDING_IX_METHOD_CODE,
  LendingEventType,
} from './_lending.js'

// @note: https://github.com/solendprotocol/solana-program-library/blob/master/token-lending/program/src/instruction.rs#L18
export const SOLEND_IX_METHOD_CODE: Record<
  string,
  LendingEventType | undefined
> = {
  ...SPL_TOKEN_LENDING_IX_METHOD_CODE,
  [14]: LendingEventType.DepositReserveLiquidityAndObligationCollateral,
  [15]: LendingEventType.WithdrawObligationCollateralAndRedeemReserveCollateral,
  // [16]: LendingEventType.UpdateReserveConfig, // Admin ix for updating reserve account data
}

export const SOLEND_IX_DATA_LAYOUT: Partial<Record<LendingEventType, any>> = {
  ...SPL_TOKEN_LENDING_IX_DATA_LAYOUT,
  [LendingEventType.InitReserve]: struct([
    u8('instruction'),
    u64('liquidityAmount'),
    blob(72, 'config'),
  ]),
  [LendingEventType.DepositReserveLiquidityAndObligationCollateral]: struct([
    u8('instruction'),
    u64('liquidityAmount'),
  ]),
  [LendingEventType.WithdrawObligationCollateralAndRedeemReserveCollateral]:
    struct([u8('instruction'), u64('collateralAmount')]),
  [LendingEventType.UpdateReserveConfig]: struct([
    u8('instruction'),
    blob(72, 'rawData'),
  ]),
}

export const SOLEND_ACCOUNT_LAYOUT: Partial<Record<LendingEventType, any>> = {
  [LendingEventType.InitReserve]: [
    'liquidity',
    'collateral',
    'reserve',
    'reserveLiquidityMint',
    'reserveLiquidityVault',
    'liquidityFeeReceiver',
    'reserveCollateralMint',
    'reserveCollateralVault',
    'pythProduct', // filtered
    'pythPriceOracle',
    'switchboardFeedAddress',
    'lendingMarket',
    'lendingMarketAuthority',
    'lendingMarketOwner',
    'transferAuthority',
    'clockProgram',
    'rentProgram',
    'tokenProgram',
  ],
  [LendingEventType.DepositReserveLiquidity]: [
    'userLiquidity',
    'userCollateral',
    'reserve',
    'reserveLiquidityVault',
    'reserveCollateralMint',
    'lendingMarket',
    'lendingMarketAuthority',
    'transferAuthority',
    'clockProgram',
    'tokenProgram',
  ],
  [LendingEventType.RedeemReserveCollateral]: [
    'userCollateral',
    'userLiquidity',
    'reserve',
    'reserveCollateralMint',
    'reserveLiquidityVault',
    'lendingMarket',
    'lendingMarketAuthority',
    'transferAuthority',
    'clockProgram',
    'tokenProgram',
  ],
  [LendingEventType.DepositObligationCollateral]: [
    'userCollateral',
    'reserveCollateralVault',
    'reserve',
    'obligation',
    'lendingMarket',
    'obligationOwner',
    'transferAuthority',
    'clockProgram',
    'tokenProgram',
  ],
  [LendingEventType.WithdrawObligationCollateral]: [
    'reserveCollateralVault',
    'userCollateral',
    'reserve',
    'obligation',
    'lendingMarket',
    'lendingMarketAuthority',
    'obligationOwner',
    'clockProgram',
    'tokenProgram',
  ],
  [LendingEventType.BorrowObligationLiquidity]: [
    'reserveLiquidityVault',
    'userLiquidity',
    'reserve',
    'liquidityFeeReceiver',
    'obligation',
    'lendingMarket',
    'lendingMarketAuthority',
    'obligationOwner',
    'clockProgram',
    'tokenProgram',
  ],
  [LendingEventType.RepayObligationLiquidity]: [
    'userLiquidity',
    'reserveLiquidityVault',
    'reserve',
    'obligation',
    'lendingMarket',
    'transferAuthority',
    'clockProgram',
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
    ['flashLoanReceiverAddresses'],
  ],
  [LendingEventType.DepositReserveLiquidityAndObligationCollateral]: [
    'userLiquidity',
    'userCollateral',
    'reserve',
    'reserveLiquidityVault',
    'reserveCollateralMint',
    'lendingMarket',
    'lendingMarketAuthority',
    'reserveCollateralVault',
    'obligation',
    'obligationOwner',
    'pythPriceOracle',
    'switchboardFeedAddress',
    'transferAuthority',
    'clockProgram',
    'tokenProgram',
  ],
  [LendingEventType.WithdrawObligationCollateralAndRedeemReserveCollateral]: [
    'reserveCollateralVault',
    'userCollateral',
    'reserve',
    'obligation',
    'lendingMarket',
    'lendingMarketAuthority',
    'userLiquidity',
    'reserveCollateralMint',
    'reserveLiquidityVault',
    'obligationOwner',
    'transferAuthority',
    'clockProgram',
    'tokenProgram',
  ],
  [LendingEventType.UpdateReserveConfig]: [
    'reserve',
    'lendingMarket',
    'lendingMarketAuthority',
    'lendingMarketOwner',
    'pythProduct',
    'pythPrice',
    'switchboardFeed',
  ],
}

export default class implements LayoutImplementation {
  name = 'solend'
  programID = SOLEND_PROGRAM_ID
  accountLayoutMap = SOLEND_ACCOUNT_LAYOUT
  dataLayoutMap = SOLEND_IX_DATA_LAYOUT
  accountDataLayoutMap = {}
  eventType = LendingEventType

  getInstructionType(data: Buffer): LendingEventType | undefined {
    const method = data.slice(0, 1).readUInt8()
    return SOLEND_IX_METHOD_CODE[method]
  }
}
