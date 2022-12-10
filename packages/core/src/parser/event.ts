import { SolanaInstructionContext } from './types.js'
import { EventBase, AlephParsedEvent } from '../types.js'

/**
 * Handles the parsing process of an instruction.
 */
export class EventParser<EventType, Info, Event extends EventBase<EventType>> {
  /**
   * Initialize the EventParser class.
   * @param eventToParserMap Stores the function for parsing each EventType.
   */
  constructor(
    protected eventToParserMap: Map<
      EventType,
      (ixCtx: SolanaInstructionContext, info: Info) => Event
    >,
  ) {}

  /**
   * Processes the instruction to obtain an event.
   * @param ixCtx Stores ixns and txn info.
   */
  parse(ixCtx: SolanaInstructionContext): Event {
    const { ix, parentIx, parentTx } = ixCtx
    const parsed = (ix as AlephParsedEvent<EventType, Info>).parsed

    const id = `${parentTx.signature}${
      parentIx ? `:${parentIx.index.toString().padStart(2, '0')}` : ''
    }:${ix.index.toString().padStart(2, '0')}`

    const timestamp = parentTx.blockTime
      ? parentTx.blockTime * 1000
      : parentTx.slot

    const baseEvent = {
      ...parsed.info,
      id,
      timestamp,
      type: parsed.type,
    }

    const parserFn = this.eventToParserMap.get(parsed.type)
    if (parserFn === undefined) {
      throw new Error(`No parser for type ${parsed.type}`)
    } else {
      return {
        ...baseEvent,
        ...parserFn(ixCtx, parsed.info),
      }
    }
  }
}
