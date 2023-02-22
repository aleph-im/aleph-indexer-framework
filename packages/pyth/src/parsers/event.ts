import {
  PythEvent,
  PythEventType, EventAccounts, PythInstructionInfo,
} from '../types.js'
import {
  SolanaParsedInstructionContext,
  SolanaParsedEvent,
} from '@aleph-indexer/solana'
import { BN } from 'bn.js'

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
      instruction as SolanaParsedEvent<PythEventType, PythInstructionInfo>
    ).parsed

    const id = `${parentTransaction.signature}${
      parentInstruction
        ? `:${parentInstruction.index.toString().padStart(2, '0')}`
        : ''
    }:${instruction.index.toString().padStart(2, '0')}`

    const timestamp = parentTransaction.blockTime
      ? parentTransaction.blockTime * 1000
      : parentTransaction.slot

    const accounts: EventAccounts = {
      fundingAccount: parsed.info.funding_account,
      productAccount: context.account,
      priceAccount: parsed.info.price_account,
    }

    const { conf, price, pubSlot, ...info } = parsed.info

    return {
      id,
      timestamp,
      type: parsed.type,
      account: context.account,
      conf: new BN(conf, "hex").toNumber(),
      price: new BN(price, "hex").toNumber(),
      pubSlot: new BN(pubSlot, "hex").toNumber(),
      ...info,
      accounts,
    } as PythEvent
  }
}

export const eventParser = new EventParser()
export default eventParser
