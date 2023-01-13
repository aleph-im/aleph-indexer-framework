import { PythEventType, ParsedEventsInfo, UpdatePriceEvent } from '../types.js'
import { InstructionContextV1, AlephParsedEvent } from '@aleph-indexer/core'

export class EventParser {
  parse(ixsContext: InstructionContextV1[]): UpdatePriceEvent[] {
    const updatePriceEvents: UpdatePriceEvent[] = []
    for (const ixCtx of ixsContext) {
      const { ix, parentIx, txContext } = ixCtx
      const parsed = (ix as AlephParsedEvent<PythEventType, ParsedEventsInfo>)
        .parsed
      if (parsed.type !== PythEventType.UpdPrice) continue

      const id = `${txContext.tx.signature}${
        parentIx ? ` :${parentIx.index.toString().padStart(2, '0')}` : ''
      }:${ix.index.toString().padStart(2, '0')}`

      const timestamp = txContext.tx.blockTime
        ? txContext.tx.blockTime * 1000
        : txContext.tx.slot

      updatePriceEvents.push({
        ...parsed.info,
        id,
        timestamp,
        type: parsed.type,
        account: txContext.parserContext.account,
      } as UpdatePriceEvent)
    }
    return updatePriceEvents
  }
}

export const eventParser = new EventParser()
export default eventParser
