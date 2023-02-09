import { ParsedEntity, RawEntity } from '../../types.js'
import { BlockchainRequestArgs } from '../types.js'
import { ParseEntityRequestArgs } from './src/types.js'

export interface ParserMsI<
  RE extends RawEntity = RawEntity,
  PE extends ParsedEntity<unknown> = ParsedEntity<unknown>,
> {
  parseEntity(args: ParseEntityRequestArgs<RE>): Promise<RE | PE>

  // @todo: Specific blockchain methods
  // /**
  //  * Parses a raw instruction.
  //  * If the instruction is not parsable, the raw instruction is returned.
  //  * @param payload The raw instruction to parse.
  //  */
  // parseInstruction(
  //   payload: RawInstruction,
  // ): Promise<RawInstruction | SolanaParsedInstructionV1>
}

export interface ParserClientI<
  RE extends RawEntity = RawEntity,
  PE extends ParsedEntity<unknown> = ParsedEntity<unknown>,
> {
  parseEntity(
    args: Omit<ParseEntityRequestArgs<RE>, keyof BlockchainRequestArgs>,
  ): Promise<RE | PE>
}
