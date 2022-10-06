import { InstructionContextV1, AlephParsedEvent } from '@aleph-indexer/core'

import {
  ParsedEvents,
  ParsedEventsInfo,
  InstructionType,
  InitializeEvent,
  ChangeAuthorityEvent,
  AddValidatorEvent,
  RemoveValidatorEvent,
  SetValidatorScoreEvent,
  ConfigValidatorSystemEvent,
  DepositEvent,
  DepositStakeAccountEvent,
  LiquidUnstakeEvent,
  AddLiquidityEvent,
  RemoveLiquidityEvent,
  SetLpParamsEvent,
  ConfigMarinadeEvent,
  OrderUnstakeEvent,
  ClaimEvent,
  StakeReserveEvent,
  UpdateActiveEvent,
  UpdateDeactivatedEvent,
  DeactivateStakeEvent,
  EmergencyUnstakeEvent,
  PartialUnstakeEvent,
  MergeStakesEvent,
} from '../utils/layouts/index.js'

export class EventParser {
  parse(ixCtx: InstructionContextV1): ParsedEvents {
    const { ix, parentIx, txContext } = ixCtx
    const parsed = (ix as AlephParsedEvent<InstructionType, ParsedEventsInfo>)
      .parsed

    const id = `${txContext.tx.signature}${
      parentIx ? ` :${parentIx.index.toString().padStart(2, '0')}` : ''
    }:${ix.index.toString().padStart(2, '0')}`

    const timestamp = txContext.tx.blockTime
      ? txContext.tx.blockTime * 1000
      : txContext.tx.slot

    const baseEvent = {
      ...parsed.info,
      id,
      timestamp,
      type: parsed.type,
      account: txContext.parserContext.account,
    }

    try {
      switch (parsed.type) {
        case InstructionType.Initialize:
          return {
            ...baseEvent,
          } as InitializeEvent

        case InstructionType.ChangeAuthority:
          return {
            ...baseEvent,
          } as ChangeAuthorityEvent

        case InstructionType.AddValidator:
          return {
            ...baseEvent,
          } as AddValidatorEvent

        case InstructionType.RemoveValidator:
          return {
            ...baseEvent,
          } as RemoveValidatorEvent

        case InstructionType.SetValidatorScore:
          return {
            ...baseEvent,
          } as SetValidatorScoreEvent

        case InstructionType.ConfigValidatorSystem:
          return {
            ...baseEvent,
          } as ConfigValidatorSystemEvent

        case InstructionType.Deposit:
          return {
            ...baseEvent,
          } as DepositEvent

        case InstructionType.DepositStakeAccount:
          return {
            ...baseEvent,
          } as DepositStakeAccountEvent

        case InstructionType.LiquidUnstake:
          return {
            ...baseEvent,
          } as LiquidUnstakeEvent

        case InstructionType.AddLiquidity:
          return {
            ...baseEvent,
          } as AddLiquidityEvent

        case InstructionType.RemoveLiquidity:
          return {
            ...baseEvent,
          } as RemoveLiquidityEvent

        case InstructionType.SetLpParams:
          return {
            ...baseEvent,
          } as SetLpParamsEvent

        case InstructionType.ConfigMarinade:
          return {
            ...baseEvent,
          } as ConfigMarinadeEvent

        case InstructionType.OrderUnstake:
          return {
            ...baseEvent,
          } as OrderUnstakeEvent

        case InstructionType.Claim:
          return {
            ...baseEvent,
          } as ClaimEvent

        case InstructionType.StakeReserve:
          return {
            ...baseEvent,
          } as StakeReserveEvent

        case InstructionType.UpdateActive:
          return {
            ...baseEvent,
          } as UpdateActiveEvent

        case InstructionType.UpdateDeactivated:
          return {
            ...baseEvent,
          } as UpdateDeactivatedEvent

        case InstructionType.DeactivateStake:
          return {
            ...baseEvent,
          } as DeactivateStakeEvent

        case InstructionType.EmergencyUnstake:
          return {
            ...baseEvent,
          } as EmergencyUnstakeEvent

        case InstructionType.PartialUnstake:
          return {
            ...baseEvent,
          } as PartialUnstakeEvent

        case InstructionType.MergeStakes:
          return {
            ...baseEvent,
          } as MergeStakesEvent

        default: {
          console.log('default -> ', parsed.type, id)
          return baseEvent as ParsedEvents
        }
      }
    } catch (e) {
      console.log('error -> ', parsed.type, id, e)
      throw e
    }
  }
}

export const eventParser = new EventParser()
export default eventParser
