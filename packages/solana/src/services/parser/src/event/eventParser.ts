import { EventBase } from '@aleph-indexer/framework'
import { SolanaParsedEvent } from '../../../../types.js'
import { SolanaParsedInstructionContext } from '../types.js'

/**
 * Handles the parsing process of an instruction.
 */
export abstract class EventParser<
  EventType,
  Info,
  Event extends EventBase<EventType>,
> {
  /**
   * Processes the instruction to obtain an event.
   * @param ixCtx Stores ixns and txn info.
   */
  abstract parse(ixCtx: SolanaParsedInstructionContext): Event

  parseBase(ixCtx: SolanaParsedInstructionContext): EventBase<EventType> {
    const { instruction, parentInstruction, parentTransaction } = ixCtx
    const parsed = (instruction as SolanaParsedEvent<EventType, Info>).parsed

    const id = `${parentTransaction.signature}${
      parentInstruction
        ? `:${parentInstruction.index.toString().padStart(2, '0')}`
        : ''
    }:${instruction.index.toString().padStart(2, '0')}`

    const timestamp = parentTransaction.timestamp

    return {
      ...parsed.info,
      id,
      timestamp,
      type: parsed.type,
    }
  }
}
