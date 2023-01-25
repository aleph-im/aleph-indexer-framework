import {
  SolanaParsedInstruction,
  SolanaRawInstruction,
} from '../../../../../types/solana.js'
import { DefinedParser } from '../../base/types.js'
import { LayoutFactory } from '../layout/layoutFactory.js'
import { LayoutImplementation } from '../layout/types.js'
import { SolanaAnchorInstructionParser } from './anchorInstructionParser.js'
import { SolanaInstructionBaseParser } from './InstructionBaseParser.js'

/**
 * Finds all available instruction parsers and aggregates them for use.
 * It is a strict but optional parser, thus it may return raw instruction if no
 * compatible parser is found.
 */
export class SolanaInstructionParser extends DefinedParser<
  SolanaRawInstruction,
  SolanaParsedInstruction
> {
  constructor(protected layoutPath?: string) {
    super()
  }

  protected instructionParsers: Record<
    string,
    DefinedParser<
      SolanaRawInstruction,
      SolanaRawInstruction | SolanaParsedInstruction
    >
  > = {}

  /**
   * Parses a raw instruction, if a parser for given solana program is available.
   * @param payload The raw instruction to parse.
   */
  async parse(
    payload: SolanaRawInstruction | SolanaParsedInstruction,
  ): Promise<SolanaRawInstruction | SolanaParsedInstruction> {
    const { programId } = payload

    const parser = await this.getParser(programId)
    if (!parser) return payload

    const parsedData = await parser.parse(payload)
    return parsedData as SolanaParsedInstruction
  }

  /**
   * Returns the parser for the given programId, if available.
   * @param programId The solana program's address.
   * @protected
   */
  protected async getParser(
    programId: string,
  ): Promise<
    | DefinedParser<
        SolanaRawInstruction,
        SolanaRawInstruction | SolanaParsedInstruction
      >
    | undefined
  > {
    let parser = this.instructionParsers[programId]
    if (parser) return parser

    let implementation: LayoutImplementation
    implementation = await LayoutFactory.getSingleton(programId)

    if (!implementation) {
      const customLayoutsMap = await this.getCustomLayoutsMap()
      implementation = customLayoutsMap[programId]
    }

    if (!implementation) return

    // @note: deserialize() is used in Beet, so we will use AnchorInstructionParser here
    const ParserClass = Object.values(implementation.dataLayoutMap)[0]
      .deserialize
      ? SolanaAnchorInstructionParser
      : SolanaInstructionBaseParser

    parser = new ParserClass(
      implementation.programID,
      implementation.name,
      implementation.getInstructionType,
      implementation.accountLayoutMap,
      implementation.dataLayoutMap,
    )

    this.instructionParsers[programId] = parser

    return parser
  }

  protected async getCustomLayoutsMap(): Promise<
    Record<string, LayoutImplementation>
  > {
    if (!this.layoutPath) return {}
    const customLayoutsMap = (await import(this.layoutPath)).default
    return customLayoutsMap || {}
  }
}
