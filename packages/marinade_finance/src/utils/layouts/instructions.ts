import { EventBase } from '@aleph-indexer/core'
import * as solita from './solita/index.js'

export enum InstructionType {
  Initialize = 'Initialize',
  ChangeAuthority = 'ChangeAuthority',
  AddValidator = 'AddValidator',
  RemoveValidator = 'RemoveValidator',
  SetValidatorScore = 'SetValidatorScore',
  ConfigValidatorSystem = 'ConfigValidatorSystem',
  Deposit = 'Deposit',
  DepositStakeAccount = 'DepositStakeAccount',
  LiquidUnstake = 'LiquidUnstake',
  AddLiquidity = 'AddLiquidity',
  RemoveLiquidity = 'RemoveLiquidity',
  SetLpParams = 'SetLpParams',
  ConfigMarinade = 'ConfigMarinade',
  OrderUnstake = 'OrderUnstake',
  Claim = 'Claim',
  StakeReserve = 'StakeReserve',
  UpdateActive = 'UpdateActive',
  UpdateDeactivated = 'UpdateDeactivated',
  DeactivateStake = 'DeactivateStake',
  EmergencyUnstake = 'EmergencyUnstake',
  PartialUnstake = 'PartialUnstake',
  MergeStakes = 'MergeStakes',
}

export type InstructionBase = EventBase<InstructionType> & {
  account: string
}

export type InitializeInfo = {
  accounts: solita.InitializeInstructionAccounts
  data: solita.InitializeInstruction
}

export type InitializeEvent = InstructionBase &
  InitializeInfo & {
    type: InstructionType.Initialize
  }

export type ChangeAuthorityInfo = {
  accounts: solita.ChangeAuthorityInstructionAccounts
  data: solita.ChangeAuthorityInstruction
}

export type ChangeAuthorityEvent = InstructionBase &
  ChangeAuthorityInfo & {
    type: InstructionType.ChangeAuthority
  }

export type AddValidatorInfo = {
  accounts: solita.AddValidatorInstructionAccounts
  data: solita.AddValidatorInstruction
}

export type AddValidatorEvent = InstructionBase &
  AddValidatorInfo & {
    type: InstructionType.AddValidator
  }

export type RemoveValidatorInfo = {
  accounts: solita.RemoveValidatorInstructionAccounts
  data: solita.RemoveValidatorInstruction
}

export type RemoveValidatorEvent = InstructionBase &
  RemoveValidatorInfo & {
    type: InstructionType.RemoveValidator
  }

export type SetValidatorScoreInfo = {
  accounts: solita.SetValidatorScoreInstructionAccounts
  data: solita.SetValidatorScoreInstruction
}

export type SetValidatorScoreEvent = InstructionBase &
  SetValidatorScoreInfo & {
    type: InstructionType.SetValidatorScore
  }

export type ConfigValidatorSystemInfo = {
  accounts: solita.ConfigValidatorSystemInstructionAccounts
  data: solita.ConfigValidatorSystemInstruction
}

export type ConfigValidatorSystemEvent = InstructionBase &
  ConfigValidatorSystemInfo & {
    type: InstructionType.ConfigValidatorSystem
  }

export type DepositInfo = {
  accounts: solita.DepositInstructionAccounts
  data: solita.DepositInstruction
}

export type DepositEvent = InstructionBase &
  DepositInfo & {
    type: InstructionType.Deposit
  }

export type DepositStakeAccountInfo = {
  accounts: solita.DepositStakeAccountInstructionAccounts
  data: solita.DepositStakeAccountInstruction
}

export type DepositStakeAccountEvent = InstructionBase &
  DepositStakeAccountInfo & {
    type: InstructionType.DepositStakeAccount
  }

export type LiquidUnstakeInfo = {
  accounts: solita.LiquidUnstakeInstructionAccounts
  data: solita.LiquidUnstakeInstruction
}

export type LiquidUnstakeEvent = InstructionBase &
  LiquidUnstakeInfo & {
    type: InstructionType.LiquidUnstake
  }

export type AddLiquidityInfo = {
  accounts: solita.AddLiquidityInstructionAccounts
  data: solita.AddLiquidityInstruction
}

export type AddLiquidityEvent = InstructionBase &
  AddLiquidityInfo & {
    type: InstructionType.AddLiquidity
  }

export type RemoveLiquidityInfo = {
  accounts: solita.RemoveLiquidityInstructionAccounts
  data: solita.RemoveLiquidityInstruction
}

export type RemoveLiquidityEvent = InstructionBase &
  RemoveLiquidityInfo & {
    type: InstructionType.RemoveLiquidity
  }

export type SetLpParamsInfo = {
  accounts: solita.SetLpParamsInstructionAccounts
  data: solita.SetLpParamsInstruction
}

export type SetLpParamsEvent = InstructionBase &
  SetLpParamsInfo & {
    type: InstructionType.SetLpParams
  }

export type ConfigMarinadeInfo = {
  accounts: solita.ConfigMarinadeInstructionAccounts
  data: solita.ConfigMarinadeInstruction
}

export type ConfigMarinadeEvent = InstructionBase &
  ConfigMarinadeInfo & {
    type: InstructionType.ConfigMarinade
  }

export type OrderUnstakeInfo = {
  accounts: solita.OrderUnstakeInstructionAccounts
  data: solita.OrderUnstakeInstruction
}

export type OrderUnstakeEvent = InstructionBase &
  OrderUnstakeInfo & {
    type: InstructionType.OrderUnstake
  }

export type ClaimInfo = {
  accounts: solita.ClaimInstructionAccounts
  data: solita.ClaimInstruction
}

export type ClaimEvent = InstructionBase &
  ClaimInfo & {
    type: InstructionType.Claim
  }

export type StakeReserveInfo = {
  accounts: solita.StakeReserveInstructionAccounts
  data: solita.StakeReserveInstruction
}

export type StakeReserveEvent = InstructionBase &
  StakeReserveInfo & {
    type: InstructionType.StakeReserve
  }

export type UpdateActiveInfo = {
  accounts: solita.UpdateActiveInstructionAccounts
  data: solita.UpdateActiveInstruction
}

export type UpdateActiveEvent = InstructionBase &
  UpdateActiveInfo & {
    type: InstructionType.UpdateActive
  }

export type UpdateDeactivatedInfo = {
  accounts: solita.UpdateDeactivatedInstructionAccounts
  data: solita.UpdateDeactivatedInstruction
}

export type UpdateDeactivatedEvent = InstructionBase &
  UpdateDeactivatedInfo & {
    type: InstructionType.UpdateDeactivated
  }

export type DeactivateStakeInfo = {
  accounts: solita.DeactivateStakeInstructionAccounts
  data: solita.DeactivateStakeInstruction
}

export type DeactivateStakeEvent = InstructionBase &
  DeactivateStakeInfo & {
    type: InstructionType.DeactivateStake
  }

export type EmergencyUnstakeInfo = {
  accounts: solita.EmergencyUnstakeInstructionAccounts
  data: solita.EmergencyUnstakeInstruction
}

export type EmergencyUnstakeEvent = InstructionBase &
  EmergencyUnstakeInfo & {
    type: InstructionType.EmergencyUnstake
  }

export type PartialUnstakeInfo = {
  accounts: solita.PartialUnstakeInstructionAccounts
  data: solita.PartialUnstakeInstruction
}

export type PartialUnstakeEvent = InstructionBase &
  PartialUnstakeInfo & {
    type: InstructionType.PartialUnstake
  }

export type MergeStakesInfo = {
  accounts: solita.MergeStakesInstructionAccounts
  data: solita.MergeStakesInstruction
}

export type MergeStakesEvent = InstructionBase &
  MergeStakesInfo & {
    type: InstructionType.MergeStakes
  }

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
    Buffer.from(solita.setLpParamsInstructionDiscriminator).toString('ascii'),
    InstructionType.SetLpParams,
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
  [InstructionType.SetLpParams]: solita.setLpParamsStruct,
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
  [InstructionType.SetLpParams]: solita.SetLpParamsAccounts,
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
  | SetLpParamsInfo
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
  | SetLpParamsEvent
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
