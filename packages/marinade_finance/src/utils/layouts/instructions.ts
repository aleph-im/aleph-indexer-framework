import { EventBase } from '@aleph-indexer/core'
import * as solita from './solita/index.js'
import BN from 'bn.js'
import { PublicKey } from '@solana/web3.js'

export enum InstructionType {
  Initialize = 'InitializeEvent',
  ChangeAuthority = 'ChangeAuthorityEvent',
  AddValidator = 'AddValidatorEvent',
  RemoveValidator = 'RemoveValidatorEvent',
  SetValidatorScore = 'SetValidatorScoreEvent',
  ConfigValidatorSystem = 'ConfigValidatorSystemEvent',
  Deposit = 'DepositEvent',
  DepositStakeAccount = 'DepositStakeAccountEvent',
  LiquidUnstake = 'LiquidUnstakeEvent',
  AddLiquidity = 'AddLiquidityEvent',
  RemoveLiquidity = 'RemoveLiquidityEvent',
  ConfigLp = 'ConfigLpEvent',
  ConfigMarinade = 'ConfigMarinadeEvent',
  OrderUnstake = 'OrderUnstakeEvent',
  Claim = 'ClaimEvent',
  StakeReserve = 'StakeReserveEvent',
  UpdateActive = 'UpdateActiveEvent',
  UpdateDeactivated = 'UpdateDeactivatedEvent',
  DeactivateStake = 'DeactivateStakeEvent',
  EmergencyUnstake = 'EmergencyUnstakeEvent',
  PartialUnstake = 'PartialUnstakeEvent',
  MergeStakes = 'MergeStakesEvent',
}

export type InstructionBase = EventBase<InstructionType> & {
  programId: string
  signer: string
  account: string
}

/*-----------------------* CUSTOM EVENTS TYPES *-----------------------*/

export type InitializeInfo = {
  data: solita.InitializeData
  accounts: solita.InitializeInstructionAccounts
}

export type InitializeEvent = InstructionBase &
  InitializeInfo & {
    type: InstructionType.Initialize
  }

/*----------------------------------------------------------------------*/

export type ChangeAuthorityInfo = {
  data: solita.ChangeAuthorityData
  accounts: solita.ChangeAuthorityInstructionAccounts
}

export type ChangeAuthorityEvent = InstructionBase &
  ChangeAuthorityInfo & {
    type: InstructionType.ChangeAuthority
  }

/*----------------------------------------------------------------------*/

export type AddValidatorEventData = {
  score: number
}

export type AddValidatorInfo = {
  data: AddValidatorEventData
  accounts: solita.AddValidatorInstructionAccounts
}

export type AddValidatorEvent = InstructionBase &
  AddValidatorInfo & {
    type: InstructionType.AddValidator
  }

/*----------------------------------------------------------------------*/

export type RemoveValidatorEventData = {
  index: number
  validatorVote: PublicKey
}

export type RemoveValidatorInfo = {
  data: RemoveValidatorEventData
  accounts: solita.RemoveValidatorInstructionAccounts
}

export type RemoveValidatorEvent = InstructionBase &
  RemoveValidatorInfo & {
    type: InstructionType.RemoveValidator
  }

/*----------------------------------------------------------------------*/

export type SetValidatorScoreEventData = {
  index: number
  validatorVote: PublicKey
  score: number
}

export type SetValidatorScoreInfo = {
  data: SetValidatorScoreEventData
  accounts: solita.SetValidatorScoreInstructionAccounts
}

export type SetValidatorScoreEvent = InstructionBase &
  SetValidatorScoreInfo & {
    type: InstructionType.SetValidatorScore
  }

/*----------------------------------------------------------------------*/

export type ConfigValidatorSystemEventData = {
  extraRuns: number
}

export type ConfigValidatorSystemInfo = {
  data: ConfigValidatorSystemEventData
  accounts: solita.ConfigValidatorSystemInstructionAccounts
}

export type ConfigValidatorSystemEvent = InstructionBase &
  ConfigValidatorSystemInfo & {
    type: InstructionType.ConfigValidatorSystem
  }

/*----------------------------------------------------------------------*/

export type DepositEventData = {
  lamports: BN
}

export type DepositInfo = {
  data: DepositEventData
  accounts: solita.DepositInstructionAccounts
}

export type DepositEvent = InstructionBase &
  DepositInfo & {
    type: InstructionType.Deposit
  }

/*----------------------------------------------------------------------*/

export type DepositStakeAccountEventData = {
  validatorIndex: number
}

export type DepositStakeAccountInfo = {
  data: DepositStakeAccountEventData
  accounts: solita.DepositStakeAccountInstructionAccounts
}

export type DepositStakeAccountEvent = InstructionBase &
  DepositStakeAccountInfo & {
    type: InstructionType.DepositStakeAccount
  }

/*----------------------------------------------------------------------*/

export type LiquidUnstakeEventData = {
  msolAmount: BN
}

export type LiquidUnstakeInfo = {
  data: LiquidUnstakeEventData
  accounts: solita.LiquidUnstakeInstructionAccounts
}

export type LiquidUnstakeEvent = InstructionBase &
  LiquidUnstakeInfo & {
    type: InstructionType.LiquidUnstake
  }

/*----------------------------------------------------------------------*/

export type AddLiquidityEventData = {
  lamports: BN
}

export type AddLiquidityInfo = {
  data: AddLiquidityEventData
  accounts: solita.AddLiquidityInstructionAccounts
}

export type AddLiquidityEvent = InstructionBase &
  AddLiquidityInfo & {
    type: InstructionType.AddLiquidity
  }

/*----------------------------------------------------------------------*/

export type RemoveLiquidityEventData = {
  tokens: BN
}

export type RemoveLiquidityInfo = {
  data: RemoveLiquidityEventData
  accounts: solita.RemoveLiquidityInstructionAccounts
}

export type RemoveLiquidityEvent = InstructionBase &
  RemoveLiquidityInfo & {
    type: InstructionType.RemoveLiquidity
  }

/*----------------------------------------------------------------------*/

export type ConfigLpInfo = {
  data: solita.ConfigLpParams
  accounts: solita.ConfigLpInstructionAccounts
}

export type ConfigLpEvent = InstructionBase &
  ConfigLpInfo & {
    type: InstructionType.ConfigLp
  }

/*----------------------------------------------------------------------*/

export type ConfigMarinadeInfo = {
  data: solita.ConfigMarinadeParams
  accounts: solita.ConfigMarinadeInstructionAccounts
}

export type ConfigMarinadeEvent = InstructionBase &
  ConfigMarinadeInfo & {
    type: InstructionType.ConfigMarinade
  }

/*----------------------------------------------------------------------*/

export type OrderUnstakeEventData = {
  msolAmount: BN
}

export type OrderUnstakeInfo = {
  data: OrderUnstakeEventData
  accounts: solita.OrderUnstakeInstructionAccounts
}

export type OrderUnstakeEvent = InstructionBase &
  OrderUnstakeInfo & {
    type: InstructionType.OrderUnstake
  }

/*----------------------------------------------------------------------*/

export type ClaimInfo = {
  accounts: solita.ClaimInstructionAccounts
}

export type ClaimEvent = InstructionBase &
  ClaimInfo & {
    type: InstructionType.Claim
  }

/*----------------------------------------------------------------------*/

export type StakeReserveEventData = {
  validatorIndex: number
}

export type StakeReserveInfo = {
  data: StakeReserveEventData
  accounts: solita.StakeReserveInstructionAccounts
}

export type StakeReserveEvent = InstructionBase &
  StakeReserveInfo & {
    type: InstructionType.StakeReserve
  }

/*----------------------------------------------------------------------*/

export type UpdateActiveEventData = {
  stakeIndex: number
  validatorIndex: number
}

export type UpdateActiveInfo = {
  data: UpdateActiveEventData
  accounts: solita.UpdateActiveInstructionAccounts
}

export type UpdateActiveEvent = InstructionBase &
  UpdateActiveInfo & {
    type: InstructionType.UpdateActive
  }

/*----------------------------------------------------------------------*/

export type UpdateDeactivatedEventData = {
  stakeIndex: number
}

export type UpdateDeactivatedInfo = {
  data: UpdateDeactivatedEventData
  accounts: solita.UpdateDeactivatedInstructionAccounts
}

export type UpdateDeactivatedEvent = InstructionBase &
  UpdateDeactivatedInfo & {
    type: InstructionType.UpdateDeactivated
  }

/*----------------------------------------------------------------------*/

export type DeactivateStakeEventData = {
  stakeIndex: number
  validatorIndex: number
}

export type DeactivateStakeInfo = {
  data: DeactivateStakeEventData
  accounts: solita.DeactivateStakeInstructionAccounts
}

export type DeactivateStakeEvent = InstructionBase &
  DeactivateStakeInfo & {
    type: InstructionType.DeactivateStake
  }

/*----------------------------------------------------------------------*/

export type EmergencyUnstakeEventData = {
  stakeIndex: number
  validatorIndex: number
}

export type EmergencyUnstakeInfo = {
  data: EmergencyUnstakeEventData
  accounts: solita.EmergencyUnstakeInstructionAccounts
}

export type EmergencyUnstakeEvent = InstructionBase &
  EmergencyUnstakeInfo & {
    type: InstructionType.EmergencyUnstake
  }

/*----------------------------------------------------------------------*/

export type PartialUnstakeEventData = {
  stakeIndex: number
  validatorIndex: number
  desiredUnstakeAmount: BN
}

export type PartialUnstakeInfo = {
  data: PartialUnstakeEventData
  accounts: solita.PartialUnstakeInstructionAccounts
}

export type PartialUnstakeEvent = InstructionBase &
  PartialUnstakeInfo & {
    type: InstructionType.PartialUnstake
  }

/*----------------------------------------------------------------------*/

export type MergeStakesEventData = {
  destinationStakeIndex: number
  sourceStakeIndex: number
  validatorIndex: number
}

export type MergeStakesInfo = {
  data: MergeStakesEventData
  accounts: solita.MergeStakesInstructionAccounts
}

export type MergeStakesEvent = InstructionBase &
  MergeStakesInfo & {
    type: InstructionType.MergeStakes
  }

/*----------------------------------------------------------------------*/

export function getInstructionType(data: Buffer): InstructionType | undefined {
  const discriminator = data.slice(0, 8)
  return IX_METHOD_CODE.get(discriminator.toString('ascii'))
}

export const IX_METHOD_CODE: Map<string, InstructionType | undefined> = new Map<
  string,
  InstructionType | undefined
>([
  [
    Buffer.from(solita.initializeInstructionDiscriminator).toString('ascii'),
    InstructionType.Initialize,
  ],
  [
    Buffer.from(solita.changeAuthorityInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.ChangeAuthority,
  ],
  [
    Buffer.from(solita.addValidatorInstructionDiscriminator).toString('ascii'),
    InstructionType.AddValidator,
  ],
  [
    Buffer.from(solita.removeValidatorInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.RemoveValidator,
  ],
  [
    Buffer.from(solita.setValidatorScoreInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.SetValidatorScore,
  ],
  [
    Buffer.from(solita.configValidatorSystemInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.ConfigValidatorSystem,
  ],
  [
    Buffer.from(solita.depositInstructionDiscriminator).toString('ascii'),
    InstructionType.Deposit,
  ],
  [
    Buffer.from(solita.depositStakeAccountInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.DepositStakeAccount,
  ],
  [
    Buffer.from(solita.liquidUnstakeInstructionDiscriminator).toString('ascii'),
    InstructionType.LiquidUnstake,
  ],
  [
    Buffer.from(solita.addLiquidityInstructionDiscriminator).toString('ascii'),
    InstructionType.AddLiquidity,
  ],
  [
    Buffer.from(solita.removeLiquidityInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.RemoveLiquidity,
  ],
  [
    Buffer.from(solita.configLpInstructionDiscriminator).toString('ascii'),
    InstructionType.ConfigLp,
  ],
  [
    Buffer.from(solita.configMarinadeInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.ConfigMarinade,
  ],
  [
    Buffer.from(solita.orderUnstakeInstructionDiscriminator).toString('ascii'),
    InstructionType.OrderUnstake,
  ],
  [
    Buffer.from(solita.claimInstructionDiscriminator).toString('ascii'),
    InstructionType.Claim,
  ],
  [
    Buffer.from(solita.stakeReserveInstructionDiscriminator).toString('ascii'),
    InstructionType.StakeReserve,
  ],
  [
    Buffer.from(solita.updateActiveInstructionDiscriminator).toString('ascii'),
    InstructionType.UpdateActive,
  ],
  [
    Buffer.from(solita.updateDeactivatedInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.UpdateDeactivated,
  ],
  [
    Buffer.from(solita.deactivateStakeInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.DeactivateStake,
  ],
  [
    Buffer.from(solita.emergencyUnstakeInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.EmergencyUnstake,
  ],
  [
    Buffer.from(solita.partialUnstakeInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.PartialUnstake,
  ],
  [
    Buffer.from(solita.mergeStakesInstructionDiscriminator).toString('ascii'),
    InstructionType.MergeStakes,
  ],
])
export const IX_DATA_LAYOUT: Partial<Record<InstructionType, any>> = {
  [InstructionType.Initialize]: solita.initializeStruct,
  [InstructionType.ChangeAuthority]: solita.changeAuthorityStruct,
  [InstructionType.AddValidator]: solita.addValidatorStruct,
  [InstructionType.RemoveValidator]: solita.removeValidatorStruct,
  [InstructionType.SetValidatorScore]: solita.setValidatorScoreStruct,
  [InstructionType.ConfigValidatorSystem]: solita.configValidatorSystemStruct,
  [InstructionType.Deposit]: solita.depositStruct,
  [InstructionType.DepositStakeAccount]: solita.depositStakeAccountStruct,
  [InstructionType.LiquidUnstake]: solita.liquidUnstakeStruct,
  [InstructionType.AddLiquidity]: solita.addLiquidityStruct,
  [InstructionType.RemoveLiquidity]: solita.removeLiquidityStruct,
  [InstructionType.ConfigLp]: solita.configLpStruct,
  [InstructionType.ConfigMarinade]: solita.configMarinadeStruct,
  [InstructionType.OrderUnstake]: solita.orderUnstakeStruct,
  [InstructionType.Claim]: solita.claimStruct,
  [InstructionType.StakeReserve]: solita.stakeReserveStruct,
  [InstructionType.UpdateActive]: solita.updateActiveStruct,
  [InstructionType.UpdateDeactivated]: solita.updateDeactivatedStruct,
  [InstructionType.DeactivateStake]: solita.deactivateStakeStruct,
  [InstructionType.EmergencyUnstake]: solita.emergencyUnstakeStruct,
  [InstructionType.PartialUnstake]: solita.partialUnstakeStruct,
  [InstructionType.MergeStakes]: solita.mergeStakesStruct,
}

export const IX_ACCOUNTS_LAYOUT: Partial<Record<InstructionType, any>> = {
  [InstructionType.Initialize]: solita.InitializeAccounts,
  [InstructionType.ChangeAuthority]: solita.ChangeAuthorityAccounts,
  [InstructionType.AddValidator]: solita.AddValidatorAccounts,
  [InstructionType.RemoveValidator]: solita.RemoveValidatorAccounts,
  [InstructionType.SetValidatorScore]: solita.SetValidatorScoreAccounts,
  [InstructionType.ConfigValidatorSystem]: solita.ConfigValidatorSystemAccounts,
  [InstructionType.Deposit]: solita.DepositAccounts,
  [InstructionType.DepositStakeAccount]: solita.DepositStakeAccountAccounts,
  [InstructionType.LiquidUnstake]: solita.LiquidUnstakeAccounts,
  [InstructionType.AddLiquidity]: solita.AddLiquidityAccounts,
  [InstructionType.RemoveLiquidity]: solita.RemoveLiquidityAccounts,
  [InstructionType.ConfigLp]: solita.ConfigLpAccounts,
  [InstructionType.ConfigMarinade]: solita.ConfigMarinadeAccounts,
  [InstructionType.OrderUnstake]: solita.OrderUnstakeAccounts,
  [InstructionType.Claim]: solita.ClaimAccounts,
  [InstructionType.StakeReserve]: solita.StakeReserveAccounts,
  [InstructionType.UpdateActive]: solita.UpdateActiveAccounts,
  [InstructionType.UpdateDeactivated]: solita.UpdateDeactivatedAccounts,
  [InstructionType.DeactivateStake]: solita.DeactivateStakeAccounts,
  [InstructionType.EmergencyUnstake]: solita.EmergencyUnstakeAccounts,
  [InstructionType.PartialUnstake]: solita.PartialUnstakeAccounts,
  [InstructionType.MergeStakes]: solita.MergeStakesAccounts,
}

export type ParsedEventsInfo =
  | InitializeInfo
  | ChangeAuthorityInfo
  | AddValidatorInfo
  | RemoveValidatorInfo
  | SetValidatorScoreInfo
  | ConfigValidatorSystemInfo
  | DepositInfo
  | DepositStakeAccountInfo
  | LiquidUnstakeInfo
  | AddLiquidityInfo
  | RemoveLiquidityInfo
  | ConfigLpInfo
  | ConfigMarinadeInfo
  | OrderUnstakeInfo
  | ClaimInfo
  | StakeReserveInfo
  | UpdateActiveInfo
  | UpdateDeactivatedInfo
  | DeactivateStakeInfo
  | EmergencyUnstakeInfo
  | PartialUnstakeInfo
  | MergeStakesInfo

export type ParsedEvents =
  | InitializeEvent
  | ChangeAuthorityEvent
  | AddValidatorEvent
  | RemoveValidatorEvent
  | SetValidatorScoreEvent
  | ConfigValidatorSystemEvent
  | DepositEvent
  | DepositStakeAccountEvent
  | LiquidUnstakeEvent
  | AddLiquidityEvent
  | RemoveLiquidityEvent
  | ConfigLpEvent
  | ConfigMarinadeEvent
  | OrderUnstakeEvent
  | ClaimEvent
  | StakeReserveEvent
  | UpdateActiveEvent
  | UpdateDeactivatedEvent
  | DeactivateStakeEvent
  | EmergencyUnstakeEvent
  | PartialUnstakeEvent
  | MergeStakesEvent
