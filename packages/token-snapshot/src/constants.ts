import { constants } from '@aleph-indexer/core'
import { LendingEventType } from './types.js'

const { TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID_PK } = constants
export { TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID_PK }

export enum ProgramName {
  TokenSnapshot = 'token-snapshot',
}

export enum LendingMarketType {
  Solend = 'solend',
  Port = 'port',
  Larix = 'larix',
}

export const LENDING_PROGRAM_MAP: Record<
  string,
  { program: string; markets: string[] }
> = {
  ['port']: {
    program: 'Port7uDYB3wk6GJAw4KT1WpTeMtSu9bTcChBHkX2LfR',
    markets: ['6T4XxKerq744sSuj3jaoV6QiZ8acirf4TrPwQzHAoSy5'],
  },
  ['solend']: {
    program: 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo',
    markets: ['4UpD2fh7xH3VP9QQaXtsS1YY3bxzWhtfpks7FatyKvdY'],
  },
  ['larix']: {
    program: '7Zb1bGi32pfsrBkzWdqd4dFhUXwp5Nybr1zuaEwN34hy',
    markets: ['5geyZJdffDBNoMqEbogbPvdgH9ue7NREobtW8M3C1qfe'],
  },
}

export const LENDING_PROGRAM_IDS = Object.keys(LENDING_PROGRAM_MAP).map(
  (key) => LENDING_PROGRAM_MAP[key].program,
)

export function getLendingMarketType(programId: string): LendingMarketType {
  return Object.keys(LENDING_PROGRAM_MAP).find(
    (key) => LENDING_PROGRAM_MAP[key].program === programId,
  ) as LendingMarketType
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