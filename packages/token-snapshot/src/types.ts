import { TokenInfo } from '@solana/spl-token-registry'
import { EventBase } from '@aleph-indexer/framework'
import { SolanaParsedEvent } from '@aleph-indexer/solana'
import BN from 'bn.js'
import { LendingMarketType } from './constants'

// ----------------------------- COMMON -----------------------------------

export type Event = SPLTokenEvent | LendingEvent

// ----------------------------- TOKEN EVENTS -----------------------------

/**
 * RAW INSTRUCTIONS
 *
 * Read this: https://docs.solana.com/integrations/exchange#depositing
 * And this: https://github.com/solana-labs/solana-program-library/blob/fc0d6a2db79bd6499f04b9be7ead0c400283845e/token/program/src/instruction.rs#L105
 * And this: https://github.com/solana-labs/solana/blob/02bc4e3fc19736bc3f74183f3ceee21598f39139/transaction-status/src/parse_token.rs
 * Examples:
 *
 * On txs:
 * 59eJF2jZ8xhsbveeoRPp5C7MNTXQALE5e8fLqYCW8chUky2gkgSSxrPYAXyBPohMR2YJ8W22x7ZjLXhdwAqWEp2L
 * 3fxdnCHn6sLK1HN39hirjAyjcCjHYsMXRpKT9jLPJVhae3SqKXsocYKijxWBKwGbr3mSSE7Uw7o3GD51NdLSAg1y
 * 3FtUT15zDkCYH4E6nfhDzhqVwkrVRW3egA6eD4CuisiHi2k35YdH415Bb5C9jVf4acx7B1ypgTakpx6X3cJFtwQ4
 *
 * initializeAccount => 31msjyAEvsFWcYLJSVXfjUEK5HtZ9pVFAhWc1qXruSpxdyu3ifx3nv3vKSg4RzGysLXWjvPqRxzrHE7wPXM2D4tc:02:03
 * closeAccount => 5ZrHS6QjdwgoFMXGqLSUnk5jnVCDT8Zam7KrdWpg4VTzbZuGabKNGoEXjv1C5aL5tcjBiGABed47MNNboPXyrzxf:03
 * mintTo => qJL22oJW1juUr6XZdzUDjxBSZscRhvUQMbrBGyqZabi6GFFwR4USUy3PPVPn4unzk1V86VWuQTEJAu5hcKESVBN:01:03
 * burn => 4EQK53nfrtEbYnYNyjZFWFzh9Bok4f5M5Wkh7NJLVDcH7HE6PGbY2DsSPPYppetSqjZGZA1bgWyurA6VYAkCkLiA:02:02
 * transfer => qJL22oJW1juUr6XZdzUDjxBSZscRhvUQMbrBGyqZabi6GFFwR4USUy3PPVPn4unzk1V86VWuQTEJAu5hcKESVBN:01:04
 * transferChecked => 3FtUT15zDkCYH4E6nfhDzhqVwkrVRW3egA6eD4CuisiHi2k35YdH415Bb5C9jVf4acx7B1ypgTakpx6X3cJFtwQ4:00
 * setAuthority => 5h3wFufzx31KZh5shSYquLnVFUGAdM1ym8Yg2xq519ZfhTYaeSsbn5g7BsRyiXszm3CvUETUpsdxaHBHF8jsom3N:00:01
 * approve => 2c4Srogftgjq92ZTMR9zTQUoZjFyEEPBXhBw4yom1m3qASwkArQHQFjBJKPGEzzWqE3pgzvatVGMJA1Y6PPCKeCM:00:00
 * revoke => 2c4Srogftgjq92ZTMR9zTQUoZjFyEEPBXhBw4yom1m3qASwkArQHQFjBJKPGEzzWqE3pgzvatVGMJA1Y6PPCKeCM:00:02
 * syncNative => G92DJX9CG4vWEUPguZk5izfxYLrpWcJDNiiwD4Anhs28yrT8XXhcj6pA1Y5XNXAZ6z4MyfrzKouqtxb582ih6YW:03
 * initializeMint => 4iggaA8mxuB1ATUGMqNYQv7Wk8fjr8KHHodqD5zYbGGhzHpk71axwFuwo4rhK6SE9gkJey4wxqc724Di23gRn5M9:02
 * multisig_transfer => 9wx2Yw2pQUDkoiZoRiHTFDuU3irVFVuP93aAv7QZnsKE5M35FXnMutQprhJoyPEK6G7bZBYcbE1ypW1nNiJGkrR:00:00
 */

export enum SPLTokenEventType {
  MintTo = 'mintTo',
  MintToChecked = 'mintToChecked',
  Burn = 'burn',
  BurnChecked = 'burnChecked',
  InitializeAccount = 'initializeAccount',
  InitializeAccount2 = 'initializeAccount2',
  InitializeAccount3 = 'initializeAccount3',
  CloseAccount = 'closeAccount',
  Transfer = 'transfer',
  TransferChecked = 'transferChecked',
  SetAuthority = 'setAuthority',
  Approve = 'approve',
  ApproveChecked = 'approveChecked',
  Revoke = 'revoke',
  SyncNative = 'syncNative',
  InitializeMint = 'initializeMint',
  InitializeMint2 = 'initializeMint2',

  // @todo
  InitializeMultisig = 'initializeMultisig',
  InitializeMultisig2 = 'initializeMultisig2',
  FreezeAccount = 'freezeAccount',
  ThawAccount = 'thawAccount',
}

export enum AuthorityType {
  /// Authority to mint new tokens
  MintTokens = 'mintTokens',
  /// Authority to freeze any account associated with the Mint
  FreezeAccount = 'freezeAccount',
  /// Owner of a given token account
  AccountOwner = 'accountOwner',
  /// Authority to close a token account
  CloseAccount = 'closeAccount',
}

export enum SPLTokenType {
  Account = 'account',
  Mint = 'mint',
  AccountMint = 'account_mint',
}

export type SPLTokenAccount = {
  address: string
  mint: string
  type: SPLTokenType
}

export type SPLTokenRawEventBase = SolanaParsedEvent<
  SPLTokenEventType,
  SPLTokenRawEventInfo
>

type SPLTokenRawEventMintToInfo = {
  account: string
  amount: string
  mint: string
  mintAuthority: string
}

export type SPLTokenRawEventMintTo = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventMintToInfo
    type: SPLTokenEventType.MintTo
  }
}

type SPLTokenRawEventMintToCheckedInfo = {
  account: string
  mint: string
  mintAuthority: string
  tokenAmount: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
}

export type SPLTokenRawEventMintToChecked = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventMintToCheckedInfo
    type: SPLTokenEventType.MintToChecked
  }
}

type SPLTokenRawEventBurnInfo = {
  account: string
  amount: string
  authority: string
  mint: string
}

export type SPLTokenRawEventBurn = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventBurnInfo
    type: SPLTokenEventType.Burn
  }
}

type SPLTokenRawEventBurnCheckedInfo = {
  account: string
  authority: string
  mint: string
  tokenAmount: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
}

export type SPLTokenRawEventBurnChecked = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventBurnCheckedInfo
    type: SPLTokenEventType.BurnChecked
  }
}

type SPLTokenRawEventInitializeAccountInfo = {
  account: string
  mint: string
  owner: string
  rentSysvar: string
}

export type SPLTokenRawEventInitializeAccountBase<T> = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventInitializeAccountInfo
    type: T
  }
}

export type SPLTokenRawEventInitializeAccount =
  SPLTokenRawEventInitializeAccountBase<SPLTokenEventType.InitializeAccount>

export type SPLTokenRawEventInitializeAccount2 =
  SPLTokenRawEventInitializeAccountBase<SPLTokenEventType.InitializeAccount2>

export type SPLTokenRawEventInitializeAccount3 =
  SPLTokenRawEventInitializeAccountBase<SPLTokenEventType.InitializeAccount3>

type SPLTokenRawEventCloseAccountInfo = {
  account: string
  destination: string
} & (
  | {
      owner: string
    }
  | {
      multisigOwner: string
      signers: string[]
    }
)

export type SPLTokenRawEventCloseAccount = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventCloseAccountInfo
    type: SPLTokenEventType.CloseAccount
  }
}

type SPLTokenRawEventTransferInfo = {
  amount: string
  destination: string
  source: string
} & (
  | {
      authority: string
    }
  | {
      multisigAuthority: string
      signers: string[]
    }
)

export type SPLTokenRawEventTransfer = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventTransferInfo
    type: SPLTokenEventType.Transfer
  }
}

type SPLTokenRawEventTransferCheckedInfo = {
  authority: string
  destination: string
  mint: string
  source: string
  tokenAmount: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
}

export type SPLTokenRawEventTransferChecked = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventTransferCheckedInfo
    type: SPLTokenEventType.TransferChecked
  }
}

type SPLTokenRawEventSetAuthorityInfo = {
  account: string
  authority: string
  authorityType: AuthorityType
  newAuthority: string
}

export type SPLTokenRawEventSetAuthority = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventSetAuthorityInfo
    type: SPLTokenEventType.SetAuthority
  }
}

type SPLTokenRawEventApproveInfo = {
  amount: string
  delegate: string
  owner: string
  source: string
}

export type SPLTokenRawEventApprove = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventApproveInfo
    type: SPLTokenEventType.Approve
  }
}

type SPLTokenRawEventApproveCheckedInfo = {
  delegate: string
  owner: string
  source: string
  mint: string
  tokenAmount: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
}

export type SPLTokenRawEventApproveChecked = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventApproveCheckedInfo
    type: SPLTokenEventType.ApproveChecked
  }
}

type SPLTokenRawEventRevokeInfo = {
  owner: string
  source: string
}

export type SPLTokenRawEventRevoke = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventRevokeInfo
    type: SPLTokenEventType.Revoke
  }
}

type SPLTokenRawEventSyncNativeInfo = {
  account: string
}

export type SPLTokenRawEventSyncNative = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventSyncNativeInfo
    type: SPLTokenEventType.SyncNative
  }
}

type SPLTokenRawEventInitializeMintBaseInfo = {
  decimals: number
  mint: string
  mintAuthority: string
  rentSysvar: string
}

export type SPLTokenRawEventInitializeMintBase<T> = SPLTokenRawEventBase & {
  parsed: {
    info: SPLTokenRawEventInitializeMintBaseInfo
    type: T
  }
}

export type SPLTokenRawEventInitializeMint =
  SPLTokenRawEventInitializeMintBase<SPLTokenEventType.InitializeMint>

export type SPLTokenRawEventInitializeMint2 =
  SPLTokenRawEventInitializeMintBase<SPLTokenEventType.InitializeMint2>

export type SPLTokenRawEvent =
  | SPLTokenRawEventMintTo
  | SPLTokenRawEventMintToChecked
  | SPLTokenRawEventBurn
  | SPLTokenRawEventBurnChecked
  | SPLTokenRawEventInitializeAccount
  | SPLTokenRawEventInitializeAccount2
  | SPLTokenRawEventInitializeAccount3
  | SPLTokenRawEventCloseAccount
  | SPLTokenRawEventTransfer
  | SPLTokenRawEventTransferChecked
  | SPLTokenRawEventSetAuthority
  | SPLTokenRawEventApprove
  | SPLTokenRawEventApproveChecked
  | SPLTokenRawEventRevoke
  | SPLTokenRawEventSyncNative
  | SPLTokenRawEventInitializeMint
  | SPLTokenRawEventInitializeMint2

export type SPLTokenRawEventInfo =
  | SPLTokenRawEventMintToInfo
  | SPLTokenRawEventMintToCheckedInfo
  | SPLTokenRawEventBurnInfo
  | SPLTokenRawEventBurnCheckedInfo
  | SPLTokenRawEventInitializeAccountInfo
  | SPLTokenRawEventCloseAccountInfo
  | SPLTokenRawEventTransferInfo
  | SPLTokenRawEventTransferCheckedInfo
  | SPLTokenRawEventSetAuthorityInfo
  | SPLTokenRawEventApproveInfo
  | SPLTokenRawEventApproveCheckedInfo
  | SPLTokenRawEventRevokeInfo
  | SPLTokenRawEventSyncNativeInfo
  | SPLTokenRawEventInitializeMintBaseInfo

// ------------------- PARSED ------------------

export type SPLTokenInfo = {
  name: string
  address: string
  programId: string
  tokenInfo: TokenInfo
}

export type SPLTokenEventBase = Omit<
  EventBase<SPLTokenEventType>,
  'account'
> & {
  account: string
  mint: string
  balance: string
  owner: string
}

export type SPLTokenEventMint = SPLTokenEventBase & {
  type: SPLTokenEventType.MintTo
  amount: string
}

export type SPLTokenEventBurn = SPLTokenEventBase & {
  type: SPLTokenEventType.Burn
  amount: string
}

export type SPLTokenEventInitializeAccount = SPLTokenEventBase & {
  type: SPLTokenEventType.InitializeAccount
}

export type SPLTokenEventCloseAccount = SPLTokenEventBase & {
  type: SPLTokenEventType.CloseAccount
  toAccount?: string
}

export type SPLTokenEventTransfer = SPLTokenEventBase & {
  type: SPLTokenEventType.Transfer
  amount: string
  toBalance: string
  toAccount: string
  toOwner?: string
}

export type SPLTokenEventSetAuthority = SPLTokenEventBase & {
  type: SPLTokenEventType.SetAuthority
  newOwner: string
  authorityType: AuthorityType
}

export type SPLTokenEventApprove = SPLTokenEventBase & {
  type: SPLTokenEventType.Approve
  amount: string
  delegate: string
}

export type SPLTokenEventRevoke = SPLTokenEventBase & {
  type: SPLTokenEventType.Revoke
}

export type SPLTokenEventSyncNative = SPLTokenEventBase & {
  type: SPLTokenEventType.SyncNative
}

export type SPLTokenEventInitializeMint = SPLTokenEventBase & {
  type: SPLTokenEventType.InitializeMint
}

export type SPLTokenEvent =
  | SPLTokenEventMint
  | SPLTokenEventBurn
  | SPLTokenEventInitializeAccount
  | SPLTokenEventCloseAccount
  | SPLTokenEventTransfer
  | SPLTokenEventSetAuthority
  | SPLTokenEventApprove
  | SPLTokenEventRevoke
  | SPLTokenEventSyncNative
  | SPLTokenEventInitializeMint

export type SPLTokenIncompleteEvent =
  | IncompleteEvent<SPLTokenEventMint>
  | IncompleteEvent<SPLTokenEventBurn>
  | IncompleteEvent<SPLTokenEventInitializeAccount>
  | IncompleteEvent<SPLTokenEventCloseAccount>
  | IncompleteEvent<SPLTokenEventTransfer>
  | IncompleteEvent<SPLTokenEventSetAuthority>
  | IncompleteEvent<SPLTokenEventApprove>
  | IncompleteEvent<SPLTokenEventRevoke>
  | IncompleteEvent<SPLTokenEventSyncNative>
  | IncompleteEvent<SPLTokenEventInitializeMint>

export type IncompleteEvent<T> = Omit<T, 'mint' | 'toOwner' | 'owner'> & {
  mint?: string
  toOwner?: string
  owner?: string
}

export type SPLTokenEventPublic = SPLTokenEvent & { tokenInfo: TokenInfo }

// ----------------------------- LENDING EVENTS -----------------------------

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

export type LendingEventBase = EventBase<LendingEventType> & {
  mint: string
  owner: string
}

export type LendingRawEvent = SolanaParsedEvent<
  LendingEventType,
  LendingEventInfo
>

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

  export type LendingInfo = {
  lendingMarket: string

  }

// ----------------------------- HOLDINGS -----------------------------------

export type LendingBalance = {
  lendingMarketType: LendingMarketType
  deposited: string
  borrowed: string
  timestamp: number
}

export type LendingHolding = {
  account: string
  tokenMint: string
  timestamp: number
  solend: LendingBalance
  port: LendingBalance
  larix: LendingBalance
}

export type Balances = {
  wallet: string
  lending: LendingHolding
  total: string
}

export type SPLTokenHolding = {
  account: string
  tokenMint: string
  owner?: string
  balances: Balances
  timestamp: number
}

// ------------------------ DISCOVERY ----------------------------------

export type DiscoveryFnReturn = {
  mints: string[]
  accounts: string[]
}

export type DiscoveryFn = () => Promise<DiscoveryFnReturn>
