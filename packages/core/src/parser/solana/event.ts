import { SolanaParsedEvent, EventBase } from '../../types/index.js'
import { SolanaInstructionContextV1 } from './types.js'

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
  abstract parse(ixCtx: SolanaInstructionContextV1): Event

  parseBase(ixCtx: SolanaInstructionContextV1): EventBase<EventType> {
    const { ix, parentIx, txContext } = ixCtx
    const parentTx = txContext.tx

    const parsed = (ix as SolanaParsedEvent<EventType, Info>).parsed

    const id = `${parentTx.signature}${
      parentIx ? `:${parentIx.index.toString().padStart(2, '0')}` : ''
    }:${ix.index.toString().padStart(2, '0')}`

    const timestamp = parentTx.blockTime
      ? parentTx.blockTime * 1000
      : parentTx.slot

    return {
      ...parsed.info,
      id,
      timestamp,
      type: parsed.type,
    }
  }
}
