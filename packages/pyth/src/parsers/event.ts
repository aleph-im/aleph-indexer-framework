import {
  PythEventType,
  UpdatePriceEvent,
  UpdPriceInstruction,
} from '../types.js'

import { InstructionContextV1 } from '@aleph-indexer/framework'
import { AlephParsedEvent } from '@aleph-indexer/core'

export class EventParser {
  parse(ixCtx: InstructionContextV1): UpdatePriceEvent {
    const { ix, parentIx, txContext } = ixCtx
    const parsed = (ix as AlephParsedEvent<PythEventType, UpdPriceInstruction>)
      .parsed
    const id = `${txContext.tx.signature}${
      parentIx ? `:${parentIx.index.toString().padStart(2, '0')}` : ''
    }:${ix.index.toString().padStart(2, '0')}`

    const timestamp = txContext.tx.blockTime
      ? txContext.tx.blockTime * 1000
      : txContext.tx.slot
    return {
      id,
      timestamp,
      type: PythEventType.UpdPrice,
      ...parsed.info,
    }
  }
}

export const eventParser = new EventParser()
export default eventParser
