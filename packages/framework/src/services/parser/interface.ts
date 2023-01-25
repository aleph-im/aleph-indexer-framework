import { ParsedTransaction, RawTransaction } from '../../types/common.js'
import { BlockchainRequestArgs } from '../types.js'
import {
  ParseAccountStateRequestArgs,
  ParseTransactionRequestArgs,
} from './src/base/types.js'

export interface ParserMsI<
  T extends RawTransaction,
  PT extends ParsedTransaction<unknown>,
  S = unknown,
  PS = unknown,
> {
  /**
   * Parses a raw transaction.
   * @param args The raw transaction to parse.
   */
  parseTransaction(args: ParseTransactionRequestArgs<T>): Promise<T | PT>

  /**
   * Parses a raw account state.
   * If the account state is not parsable, the raw state is returned.
   * @param args The raw account data to parse, usually a buffer.
   */
  parseAccountState(args: ParseAccountStateRequestArgs<S>): Promise<S | PS>

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
  T extends RawTransaction,
  PT extends ParsedTransaction<unknown>,
  S = unknown,
  PS = unknown,
> {
  parseTransaction(
    args: Omit<ParseTransactionRequestArgs<T>, keyof BlockchainRequestArgs>,
  ): Promise<T | PT>
  parseAccountState(
    args: Omit<ParseAccountStateRequestArgs<S>, keyof BlockchainRequestArgs>,
  ): Promise<S | PS>
}
