import { ParsedInstructionV1, RawInstruction } from '@aleph-indexer/core'
import { LayoutFactory } from './layout/layoutFactory.js'
import { DefinedParser } from './parser.js'
import { InstructionParser } from './instructionParser.js'
import { LayoutImplementation } from './layout/types.js'

/**
 * Finds all available instruction parsers and aggregates them for use.
 * It is a strict but optional parser, thus it may return raw instruction if no
 * compatible parser is found.
 */
export class InstructionParserLibrary extends DefinedParser<
  RawInstruction,
  ParsedInstructionV1
> {
  constructor(protected layoutPath?: string) {
    super()
  }

  protected instructionParsers: Record<
    string,
    DefinedParser<RawInstruction, RawInstruction | ParsedInstructionV1>
  > = {}

  /**
   * Parses a raw instruction, if a parser for given solana program is available.
   * @param payload The raw instruction to parse.
   */
  async parse(
    payload: RawInstruction | ParsedInstructionV1,
  ): Promise<RawInstruction | ParsedInstructionV1> {
    const { programId } = payload

    const parser = await this.getParser(programId)
    if (!parser) return payload

    const parsedData = await parser.parse(payload)
    return parsedData as ParsedInstructionV1
  }

  /**
   * Returns the parser for the given programId, if available.
   * @param programId The solana program's address.
   * @protected
   */
  protected async getParser(
    programId: string,
  ): Promise<
    | DefinedParser<RawInstruction, RawInstruction | ParsedInstructionV1>
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

    parser = new InstructionParser(
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
