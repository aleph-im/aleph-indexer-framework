import {
  ParsedTransactionV1,
  ParsedInstructionV1,
  ParsedAccountInfoV1,
  RawTransactionV1,
  RawInstruction,
  RawAccountInfo,
} from '@aleph-indexer/core'

export interface ParserMsI {
  /**
   * Parses a raw transaction.
   * @param payload The raw transaction to parse.
   */
  parseTransaction(payload: RawTransactionV1): Promise<ParsedTransactionV1>

  /**
   * Parses a raw instruction.
   * If the instruction is not parsable, the raw instruction is returned.
   * @param payload The raw instruction to parse.
   */
  parseInstruction(
    payload: RawInstruction,
  ): Promise<RawInstruction | ParsedInstructionV1>

  /**
   * Parses a raw account info.
   * If the account info is not parsable, the raw account info is returned.
   * @param account The account address.
   * @param payload The raw account data to parse, usually a buffer.
   */
  parseAccountData(
    account: string,
    payload: unknown,
  ): Promise<RawAccountInfo | ParsedAccountInfoV1>
}
