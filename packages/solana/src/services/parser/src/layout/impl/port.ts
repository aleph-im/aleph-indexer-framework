import {
  SPL_TOKEN_LENDING_IX_DATA_LAYOUT,
  SPL_TOKEN_LENDING_IX_METHOD_CODE,
  LendingEventType,
} from './_lending.js'
import { struct, u8, blob, u64 } from './_default.js'
import { LayoutImplementation } from '../types.js'
import { PORT_PROGRAM_ID } from '../layoutHub.js'

// @note: https://github.com/port-finance/variable-rate-lending/blob/master/token-lending/program/src/instruction.rs#L23
export const PORT_IX_METHOD_CODE: Record<string, LendingEventType | undefined> =
  {
    ...SPL_TOKEN_LENDING_IX_METHOD_CODE,
    [14]: LendingEventType.DepositReserveLiquidityAndObligationCollateral,
  }

export const PORT_IX_DATA_LAYOUT: Partial<Record<LendingEventType, any>> = {
  ...SPL_TOKEN_LENDING_IX_DATA_LAYOUT,
  [LendingEventType.InitReserve]: struct([
    u8('instruction'),
    u64('liquidityAmount'),
    blob(77, 'config'),
  ]),
  [LendingEventType.DepositReserveLiquidityAndObligationCollateral]: struct([
    u8('instruction'),
    u64('liquidityAmount'),
  ]),
  [LendingEventType.Unknown16]: struct([
    u8('instruction'),
    blob(57, 'rawData'),
  ]),
  [LendingEventType.Unknown18]: struct([
    u8('instruction'),
    blob(33, 'rawData'),
  ]),
}

export const PORT_ACCOUNT_LAYOUT: Partial<Record<LendingEventType, any>> = {
  // https://solscan.io/tx/3GaiQN8rgPiU3wZ29kSUo7WBYNW6gMnRskbMs6mJ4UQKT4STwtdioAuTPNCdAdYqbsQRdZ6HDMFWo83KvovN1m75 [ix 4]
  // https://solscan.io/tx/3XYkg3rZG4erYDTMB2nJJfyD4wD68KXYaZvr5wFALowYgECfjGd6frubtQTqBHAEKXziFZSWDAL7iLcbKjKsDEwu [ix 4]
  [LendingEventType.InitReserve]: [
    'liquidity',
    'collateral',
    'reserve',
    'reserveLiquidityMint',
    'reserveLiquidityVault',
    'liquidityFeeReceiver',
    'reserveCollateralMint',
    'reserveCollateralVault',
    'lendingMarket',
    'lendingMarketAuthority',
    'lendingMarketOwner',
    'transferAuthority',
    'clockProgram',
    'rentProgram',
    'tokenProgram',
    // Optional
    'pythPriceOracle',
  ],
  // https://solscan.io/tx/66LCaXqnwou1E7PhBcUND53DmGeayV12zByihQ4Rqz63giZpwNMerWypSeMCZFzSSB8ZpCTCJhYh9if9kPi4ez7F [ix 2.2]
  [LendingEventType.RefreshReserve]: [
    'reserve',
    'clockProgram',
    // Optional
    'pythPriceOracle',
  ],
  // https://solscan.io/tx/66LCaXqnwou1E7PhBcUND53DmGeayV12zByihQ4Rqz63giZpwNMerWypSeMCZFzSSB8ZpCTCJhYh9if9kPi4ez7F [ix 2.3]
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
  // https://solscan.io/tx/5hBEz7GhinhKFFkWPu1atyPSmVTu8FS4wb7SbtxedY1tWY3Rwqj49ouMwgjD7eNKfYgKtYg6FhXamoSyx7D7iykT [ix 5] (wrong solscan tags)
  // https://solscan.io/tx/NPuDooZv78sBeQJVxc1N1BPyz2HWAeRcVFYs2v3LqQsUVnEVjkFZMMF9omVwzfNxLCvcGypKh8n3TzUmorq1BC5 [ix 3.4] (wrong solscan tags)
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
    // Optional
    'stakeAccount',
    'stakingPool',
    'stakingProgram',
  ],
  // https://solscan.io/tx/4gnrbKeUKWqztvXudok2cgJGzZdpRdwP3jnPHS1mSHuDhd279vCeQf2GcE6q88C2HEEdbFuCArBKNUopFZYEw2dU [ix 2]
  [LendingEventType.InitObligation]: [
    'obligation',
    'lendingMarket',
    'obligationOwner',
    'clockProgram',
    'rentProgram',
    'tokenProgram',
  ],
  // https://solscan.io/tx/NPuDooZv78sBeQJVxc1N1BPyz2HWAeRcVFYs2v3LqQsUVnEVjkFZMMF9omVwzfNxLCvcGypKh8n3TzUmorq1BC5 [ix 2]
  [LendingEventType.RefreshObligation]: [
    'obligation',
    'clockProgram',
    ['reserve'], // reserve (depositing / withdrawing / repaying / liquidating)
  ],
  // https://solscan.io/tx/2UXVudWbQ7PXQGBFigkw5Lq3NLZBENg9a9FiV55MPJdvxDhdsCSGFpT3dqRxpJ3QGetwejMnTdvqWcNNDnxP1Atp [ix 3]
  [LendingEventType.DepositObligationCollateral]: [
    'userCollateral',
    'reserveCollateralVault',
    'reserve',
    'obligation',
    'lendingMarket',
    'lendingMarketAuthority',
    'obligationOwner',
    'transferAuthority',
    'clockProgram',
    'tokenProgram',
    // Optional
    'stakeAccount',
    'stakingPool',
    'stakingProgram',
  ],
  // https://solscan.io/tx/5hBEz7GhinhKFFkWPu1atyPSmVTu8FS4wb7SbtxedY1tWY3Rwqj49ouMwgjD7eNKfYgKtYg6FhXamoSyx7D7iykT [ix 3]
  // https://solscan.io/tx/NPuDooZv78sBeQJVxc1N1BPyz2HWAeRcVFYs2v3LqQsUVnEVjkFZMMF9omVwzfNxLCvcGypKh8n3TzUmorq1BC5 [ix 3.1]
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
    // Optional
    'stakeAccount',
    'stakingPool',
    'stakingProgram',
  ],
  // https://solscan.io/tx/fDvtf2g6x9urGwhhaPkqfsuCU3MUeDTd6GQjyiBRFgqg5yxT9Vqav9WwQH2cHHFXZE4YooXZDWFpL9X3oJXGGt5 [ix 6]
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
  // https://solscan.io/tx/XkpY8MsCC5cT4nf8Kabsepyw5ytbDieC3E2KqDnJsVNAteFX24PwUdkW4XRKpayrztvKkx4AFicFxD9MACEePdA [ix 5] (wrong solscan tags)
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
  // https://solscan.io/tx/51zxM49rTRrumjF1TpeNvPFjXv8ectzMbNsneVGqK5TdRLZfucsZ2p4q9MYeCWhTRQZjzQK81fPM7RfGWZVyy9Cn [ix 4]
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
    // Optional
    'stakeAccount',
    'stakingPool',
    'stakingProgram',
  ],
  // https://solscan.io/tx/QjdHYYKKMPbw6aGwoma7BYsvjyCWHWRfDYFGnNGjgwL3yBudWcYNpoiHEf4vqcwgLtTGxgsLDjWV4yoQUgEKWjx [ix 4.2]
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
    'transferAuthority',
    'clockProgram',
    'tokenProgram',
    // Optional
    'stakeAccount',
    'stakingPool',
    'stakingProgram',
  ],
  // https://solscan.io/tx/941hKz4PZv2umJwbxHMBECPPC7YP6PDMdxx5uXrdq3Czb5NJKNv7DU4LwWUP6uaNFPpoF86uj6qhBFqZsV9Z8RZ [ix 1]
  [LendingEventType.Unknown16]: [
    'reserve',
    'lendingMarket',
    'lendingMarketAuthority',
    'unknown',
    'rentProgram',
    'tokenProgram',
  ],
  // https://solscan.io/tx/5et5DQWgfWmjFCypDeWT5LPjnbXqQqQVj7kqNSKTSDjneNXks4V6PnQQGK1F38L1tUxXt3beFgTa7QTr3Mdq7q4b [ix 1]
  [LendingEventType.Unknown18]: [
    'reserve',
    'lendingMarket',
    'unknown',
    'pythPriceOracle',
  ],
}

export default class implements LayoutImplementation {
  name = 'port'
  programID = PORT_PROGRAM_ID
  accountLayoutMap = PORT_ACCOUNT_LAYOUT
  dataLayoutMap = PORT_IX_DATA_LAYOUT
  accountDataLayoutMap = {}
  eventType = LendingEventType

  getInstructionType(data: Buffer): LendingEventType | undefined {
    const method = data.slice(0, 1).readUInt8()
    return PORT_IX_METHOD_CODE[method]
  }
}
