import { DefinedParser } from '@aleph-indexer/framework'
import bs58 from 'bs58'
import {
  SolanaRawInstruction,
  AlephParsedInstruction,
  AlephParsedParsedInstruction,
  AlephParsedInnerInstruction,
} from '../../../../types.js'

/**
 * Parses a raw instruction, if a parser for given solana program is available.
 * Based on solana-program-library, use {@link AnchorInstructionParser} for Anchor instructions, when using Beet as a
 * layout descriptor.
 */
export class SolanaInstructionBaseParser<
  EventTypeEnum extends string,
> extends DefinedParser<
  SolanaRawInstruction,
  SolanaRawInstruction | AlephParsedInstruction
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
    rawIx: SolanaRawInstruction | AlephParsedInstruction,
  ): SolanaRawInstruction | AlephParsedInstruction {
    if (!this.isCompatibleInstruction(rawIx)) return rawIx

    const decoded = this.getInstructionData(rawIx)
    if (!decoded) return rawIx

    const type = this.getInstructionType(decoded)
    if (!type) return rawIx

    const parsedIx: AlephParsedParsedInstruction = rawIx as any
    parsedIx.program = this.programName

    const data = this.parseInstructionData(type, decoded)
    const accounts = this.parseInstructionAccounts(type, parsedIx)
    parsedIx.parsed = {
      type,
      info: {
        ...(rawIx as any).parsed?.info,
        ...data,
        ...accounts,
      },
    }

    return parsedIx
  }

  protected isCompatibleInstruction(
    ix:
      | SolanaRawInstruction
      | AlephParsedInstruction
      | AlephParsedInnerInstruction,
  ): boolean {
    return ix.programId === this.programId
  }

  protected getInstructionData(
    rawIx: SolanaRawInstruction | AlephParsedInstruction,
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
    rawIx: SolanaRawInstruction | AlephParsedInstruction,
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
