import { InstructionContext } from '../indexer/index.js'
import { EventBase, AlephParsedEvent } from '../types.js'

export class EventParser<EventType, Info, Event extends EventBase<EventType>> {
  constructor(
    protected eventToParserMap: Map<
      EventType,
      (ixCtx: InstructionContext, info: Info) => Event
    >,
  ) {}

  parse(ixCtx: InstructionContext): Event {
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
