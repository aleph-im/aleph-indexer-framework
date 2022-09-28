import bs58 from 'bs58'
import {
  AlephParsedInnerInstruction,
  AlephParsedInstruction,
  AlephParsedParsedInstruction,
  RawInstruction,
} from '@aleph-indexer/core'
import { DefinedParser } from './parser.js'

// @note: Based on solana-program-library (would need different implementation for Anchor-based programs).
export class InstructionParser<
  EventTypeEnum extends string,
> extends DefinedParser<
  RawInstruction,
  RawInstruction | AlephParsedInstruction
> {
  constructor(
    public programId: string,
    public programName: string,
    protected getInstructionType: (data: Buffer) => EventTypeEnum | undefined,
    protected accountLayouts: Partial<Record<EventTypeEnum, any>>,
    protected dataLayouts: Partial<Record<EventTypeEnum, any>>,
  ) {
    super()
  }

  parse(
    rawIx: RawInstruction | AlephParsedInstruction,
  ): RawInstruction | AlephParsedInstruction {
    if (!this.isCompatibleInstruction(rawIx)) return rawIx

    const decoded = this.getInstructionData(rawIx)
    if (!decoded) return rawIx

    const type = this.getInstructionType(decoded)
    if (!type) return rawIx

    const parsedIx: AlephParsedParsedInstruction = rawIx as any
    parsedIx.program = this.programName

    parsedIx.parsed = {
      type,
      info: {
        ...(rawIx as any).parsed?.info,
        ...this.parseInstructionData(type, decoded),
        ...this.parseInstructionAccounts(type, parsedIx),
      },
    }

    return parsedIx
  }

  protected isCompatibleInstruction(
    ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
  ): boolean {
    return ix.programId === this.programId
  }

  protected getInstructionData(
    rawIx: RawInstruction | AlephParsedInstruction,
  ): Buffer | undefined {
    if (!('data' in rawIx)) return
    return Buffer.from(bs58.decode(rawIx.data))
  }

  protected parseInstructionData(type: EventTypeEnum, data: Buffer): any {
    try {
      const template = this.dataLayouts[type]
      if (!template) return {}

      return this.dataLayouts[type].decode(data)
    } catch (e) {
      console.error(e)
    }
  }

  protected parseInstructionAccounts(
    type: EventTypeEnum,
    rawIx: RawInstruction | AlephParsedInstruction,
  ): any {
    const info: any = {}

    const template = this.dataLayouts[type]
    if (!template) return {}

    if ('accounts' in rawIx) {
      for (const [index, name] of this.accountLayouts[type].entries()) {
        info[name] = rawIx.accounts[index]
      }
    }

    return info
  }
}
