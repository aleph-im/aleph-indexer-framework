import {
  ParsedEventsInfo,
  UpdPriceInstruction,
  PythEvent,
  PythEventType,
  IxEventInfo,
  IxAccounts,
} from '../types.js'
import { AlephParsedEvent, InstructionContextV1 } from '@aleph-indexer/core'
import { pythOracleCoder } from '@pythnetwork/client'

export class EventParser {
  parse(ixsContext: InstructionContextV1[]): PythEvent[] {
    const updatePriceEvents: PythEvent[] = []
    for (const ixCtx of ixsContext) {
      const { ix, parentIx, txContext } = ixCtx
      const parsed = (ix as AlephParsedEvent<PythEventType, ParsedEventsInfo>)
        .parsed

      if ('data' in ix) {
        const decoded = pythOracleCoder().instruction.decode(ix.data, 'base58')
        if (
          decoded &&
          (decoded.data as IxEventInfo) &&
          decoded.data.price.toNumber() > 0
        ) {
          const id = `${txContext.tx.signature}${
            parentIx ? ` :${parentIx.index.toString().padStart(2, '0')}` : ''
          }:${ix.index.toString().padStart(2, '0')}`

          const accounts: IxAccounts = {
            fundingAccount: ix.accounts[0],
            priceAccount: ix.accounts[1],
            productAccount: ix.accounts[2], // not correct, corresponds to the clock account
          }

          const timestamp = txContext.tx.blockTime
            ? txContext.tx.blockTime * 1000
            : txContext.tx.slot

          const ixData: ParsedEventsInfo = {
            status: decoded.data.status as number,
            unused: decoded.data.unused as number,
            price: decoded.data.price.toNumber() as number,
            conf: decoded.data.conf.toNumber() as number,
            pubSlot: decoded.data.pubSlot.toNumber() as number,
            accounts: accounts,
          }

          updatePriceEvents.push({
            id,
            timestamp,
            type: parsed.type,
            account: txContext.parserContext.account,
            ...ixData,
          } as PythEvent)
        }
      }
    }
    return updatePriceEvents
  }

  isUpdatePriceEvent(info: ParsedEventsInfo): info is UpdPriceInstruction {
    return (info as UpdPriceInstruction).pubSlot !== undefined
  }
}

export const eventParser = new EventParser()
export default eventParser
