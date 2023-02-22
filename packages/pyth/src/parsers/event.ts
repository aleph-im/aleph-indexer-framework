import {
  PythEventInfo,
  UpdPriceInstruction,
  PythEvent,
  PythEventType,
} from '../types.js'
import {
  SolanaParsedInstructionContext,
  SolanaParsedEvent,
} from '@aleph-indexer/solana'
import { ParserContext } from '@aleph-indexer/framework'

export class EventParser {
  parse(
    context: {
      account: string
      startDate: number
      endDate: number
    },
    ixCtx: SolanaParsedInstructionContext
  ): PythEvent {
    const { instruction, parentInstruction, parentTransaction } = ixCtx
    const parsed = (
      instruction as SolanaParsedEvent<PythEventType, PythEventInfo>
    ).parsed

    const id = `${parentTransaction.signature}${
      parentInstruction
        ? `:${parentInstruction.index.toString().padStart(2, '0')}`
        : ''
    }:${instruction.index.toString().padStart(2, '0')}`

    const timestamp = parentTransaction.blockTime
      ? parentTransaction.blockTime * 1000
      : parentTransaction.slot

    return {
      id,
      timestamp,
      type: parsed.type,
      account: context.account,
      ...parsed.info,
    } as PythEvent
  }

  isUpdatePriceEvent(info: PythEventInfo): info is UpdPriceInstruction {
    return (info as UpdPriceInstruction).pubSlot !== undefined
  }
}

export const eventParser = new EventParser()
export default eventParser
