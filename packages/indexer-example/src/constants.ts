import BN from 'bn.js'
import { constants } from '@aleph-indexer/core'
import { LendingEventType } from './types.js'

export const ACCOUNT_MAP: Record<
  string,
  { program: string; mainMarket: string }
> = {
  ['port']: {
    program: 'Port7uDYB3wk6GJAw4KT1WpTeMtSu9bTcChBHkX2LfR',
    mainMarket: '6T4XxKerq744sSuj3jaoV6QiZ8acirf4TrPwQzHAoSy5',
  },
  ['solend']: {
    program: 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo',
    mainMarket: '4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY',
  },
  ['larix']: {
    program: '7Zb1bGi32pfsrBkzWdqd4dFhUXwp5Nybr1zuaEwN34hy',
    mainMarket: '5geyZJdffDBNoMqEbogbPvdgH9ue7NREobtW8M3C1qfe',
  },
}

// ----------------- EVENTS --------------------
export const liquidityEvents = [
  LendingEventType.DepositReserveLiquidity,
  LendingEventType.RedeemReserveCollateral,
  LendingEventType.BorrowObligationLiquidity,
  LendingEventType.RepayObligationLiquidity,
  LendingEventType.LiquidateObligation,
  LendingEventType.DepositReserveLiquidityAndObligationCollateral,
  LendingEventType.WithdrawObligationCollateralAndRedeemReserveCollateral,
  LendingEventType.LiquidateObligation2,
]

export const liquidityEventsWhitelist = new Set(liquidityEvents)

export const borrowEvents = [
  LendingEventType.BorrowObligationLiquidity,
  LendingEventType.RepayObligationLiquidity,
  LendingEventType.LiquidateObligation,
  LendingEventType.LiquidateObligation2,
]

export const borrowEventsWhitelist = new Set(borrowEvents)

export const liquidationEventsWhitelist = new Set([
  LendingEventType.LiquidateObligation,
  LendingEventType.LiquidateObligation2,
])

export const flashLoanEventsWhitelist = new Set([LendingEventType.FlashLoan])

// WADS

export const usdDecimals = new BN(constants.usdDecimals)
export const usdWad = new BN(
  '1'.concat(Array(usdDecimals.toNumber() + 1).join('0')),
)
export const WAD_DECIMALS = new BN(18)
export const WAD = new BN(
  '1'.concat(Array(WAD_DECIMALS.toNumber() + 1).join('0')),
)
