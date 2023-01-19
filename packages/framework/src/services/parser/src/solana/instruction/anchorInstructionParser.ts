import { SolanaInstructionBaseParser } from './InstructionBaseParser.js'

/**
 * Parses a raw instruction, if a parser for given solana program is available.
 * This parser is automatically used for indexers generated from IDL with anchor-ts-generator.
 */
export class SolanaAnchorInstructionParser<
  EventTypeEnum extends string,
> extends SolanaInstructionBaseParser<EventTypeEnum> {
  protected parseInstructionData(type: EventTypeEnum, data: Buffer): any {
    try {
      const template = this.dataLayouts[type]
      if (!template) return {}

      const [context] = this.dataLayouts[type].deserialize(data)
      const { instructionDiscriminator, ...result } = context

      return result
    } catch (e) {
      console.error(e)
    }
  }
}
