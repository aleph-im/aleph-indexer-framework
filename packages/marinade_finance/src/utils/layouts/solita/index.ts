export * from './accounts/index.js'
export * from './errors/index.js'
export * from './instructions/index.js'
export * from './types/index.js'
import { AccountMeta, PublicKey } from '@solana/web3.js'

import {
  State,
  StateArgs,
  TicketAccountData,
  TicketAccountDataArgs,
} from './accounts'

import {
  Fee,
  LiqPoolInitializeData,
  InitializeData,
  ChangeAuthorityData,
  ConfigLpParams,
  ConfigMarinadeParams,
  LiqPool,
  List,
  StakeRecord,
  StakeSystem,
  ValidatorRecord,
  ValidatorSystem,
} from './types'

export type InitializeInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const InitializeAccounts = [
  'creatorAuthority',
  'state',
  'reservePda',
  'stakeList',
  'validatorList',
  'msolMint',
  'operationalSolAccount',
  'liqPool',
  'treasuryMsolAccount',
  'clock',
  'rent',
]

export type ChangeAuthorityInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const ChangeAuthorityAccounts = ['state', 'adminAuthority']

export type AddValidatorInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const AddValidatorAccounts = [
  'state',
  'managerAuthority',
  'validatorList',
  'validatorVote',
  'duplicationFlag',
  'rentPayer',
  'clock',
  'rent',
  'systemProgram',
]

export type RemoveValidatorInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const RemoveValidatorAccounts = [
  'state',
  'managerAuthority',
  'validatorList',
  'duplicationFlag',
  'operationalSolAccount',
]

export type SetValidatorScoreInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const SetValidatorScoreAccounts = [
  'state',
  'managerAuthority',
  'validatorList',
]

export type ConfigValidatorSystemInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const ConfigValidatorSystemAccounts = ['state', 'managerAuthority']

export type DepositInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const DepositAccounts = [
  'state',
  'msolMint',
  'liqPoolSolLegPda',
  'liqPoolMsolLeg',
  'liqPoolMsolLegAuthority',
  'reservePda',
  'transferFrom',
  'mintTo',
  'msolMintAuthority',
  'systemProgram',
  'tokenProgram',
]

export type DepositStakeAccountInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const DepositStakeAccountAccounts = [
  'state',
  'validatorList',
  'stakeList',
  'stakeAccount',
  'stakeAuthority',
  'duplicationFlag',
  'rentPayer',
  'msolMint',
  'mintTo',
  'msolMintAuthority',
  'clock',
  'rent',
  'systemProgram',
  'tokenProgram',
  'stakeProgram',
]

export type LiquidUnstakeInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const LiquidUnstakeAccounts = [
  'state',
  'msolMint',
  'liqPoolSolLegPda',
  'liqPoolMsolLeg',
  'treasuryMsolAccount',
  'getMsolFrom',
  'getMsolFromAuthority',
  'transferSolTo',
  'systemProgram',
  'tokenProgram',
]

export type AddLiquidityInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const AddLiquidityAccounts = [
  'state',
  'lpMint',
  'lpMintAuthority',
  'liqPoolMsolLeg',
  'liqPoolSolLegPda',
  'transferFrom',
  'mintTo',
  'systemProgram',
  'tokenProgram',
]

export type RemoveLiquidityInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const RemoveLiquidityAccounts = [
  'state',
  'lpMint',
  'burnFrom',
  'burnFromAuthority',
  'transferSolTo',
  'transferMsolTo',
  'liqPoolSolLegPda',
  'liqPoolMsolLeg',
  'liqPoolMsolLegAuthority',
  'systemProgram',
  'tokenProgram',
]

export type ConfigLpInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const ConfigLpAccounts = ['state', 'adminAuthority']

export type ConfigMarinadeInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const ConfigMarinadeAccounts = ['state', 'adminAuthority']

export type OrderUnstakeInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const OrderUnstakeAccounts = [
  'state',
  'msolMint',
  'burnMsolFrom',
  'burnMsolAuthority',
  'newTicketAccount',
  'clock',
  'rent',
  'tokenProgram',
]

export type ClaimInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const ClaimAccounts = [
  'state',
  'reservePda',
  'ticketAccount',
  'transferSolTo',
  'clock',
  'systemProgram',
]

export type StakeReserveInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const StakeReserveAccounts = [
  'state',
  'validatorList',
  'stakeList',
  'validatorVote',
  'reservePda',
  'stakeAccount',
  'stakeDepositAuthority',
  'clock',
  'epochSchedule',
  'rent',
  'stakeHistory',
  'stakeConfig',
  'systemProgram',
  'stakeProgram',
]

export type UpdateActiveInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const UpdateActiveAccounts = ['common', 'validatorList']

export type UpdateDeactivatedInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const UpdateDeactivatedAccounts = [
  'common',
  'operationalSolAccount',
  'systemProgram',
]

export type DeactivateStakeInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const DeactivateStakeAccounts = [
  'state',
  'reservePda',
  'validatorList',
  'stakeList',
  'stakeAccount',
  'stakeDepositAuthority',
  'splitStakeAccount',
  'splitStakeRentPayer',
  'clock',
  'rent',
  'epochSchedule',
  'stakeHistory',
  'systemProgram',
  'stakeProgram',
]

export type EmergencyUnstakeInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const EmergencyUnstakeAccounts = [
  'state',
  'validatorManagerAuthority',
  'validatorList',
  'stakeList',
  'stakeAccount',
  'stakeDepositAuthority',
  'clock',
  'stakeProgram',
]

export type PartialUnstakeInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const PartialUnstakeAccounts = [
  'state',
  'validatorManagerAuthority',
  'validatorList',
  'stakeList',
  'stakeAccount',
  'stakeDepositAuthority',
  'reservePda',
  'splitStakeAccount',
  'splitStakeRentPayer',
  'clock',
  'rent',
  'stakeHistory',
  'systemProgram',
  'stakeProgram',
]

export type MergeStakesInstruction = {
  programId: PublicKey
  keys: AccountMeta[]
  data: Buffer
}

export const MergeStakesAccounts = [
  'state',
  'stakeList',
  'validatorList',
  'destinationStake',
  'sourceStake',
  'stakeDepositAuthority',
  'stakeWithdrawAuthority',
  'operationalSolAccount',
  'clock',
  'stakeHistory',
  'stakeProgram',
]

export type ParsedInstructions =
  | InitializeInstruction
  | ChangeAuthorityInstruction
  | AddValidatorInstruction
  | RemoveValidatorInstruction
  | SetValidatorScoreInstruction
  | ConfigValidatorSystemInstruction
  | DepositInstruction
  | DepositStakeAccountInstruction
  | LiquidUnstakeInstruction
  | AddLiquidityInstruction
  | RemoveLiquidityInstruction
  | ConfigLpInstruction
  | ConfigMarinadeInstruction
  | OrderUnstakeInstruction
  | ClaimInstruction
  | StakeReserveInstruction
  | UpdateActiveInstruction
  | UpdateDeactivatedInstruction
  | DeactivateStakeInstruction
  | EmergencyUnstakeInstruction
  | PartialUnstakeInstruction
  | MergeStakesInstruction
export type ParsedAccounts = State | TicketAccountData

export type ParsedAccountsData = StateArgs | TicketAccountDataArgs

export type ParsedTypes =
  | Fee
  | LiqPoolInitializeData
  | InitializeData
  | ChangeAuthorityData
  | ConfigLpParams
  | ConfigMarinadeParams
  | LiqPool
  | List
  | StakeRecord
  | StakeSystem
  | ValidatorRecord
  | ValidatorSystem
