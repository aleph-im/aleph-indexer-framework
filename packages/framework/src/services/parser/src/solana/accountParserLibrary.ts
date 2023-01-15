import { AlephParsedAccountInfo, RawAccountInfo } from '@aleph-indexer/core'
import { LayoutFactory } from './layout/layoutFactory.js'
import { AccountParser } from './accountParser.js'
import { DefinedParser } from '../base/types.js'

/**
 * Finds all available account parsers and aggregates them for use.
 */
export class AccountParserLibrary extends DefinedParser<
  RawAccountInfo,
  RawAccountInfo | AlephParsedAccountInfo
> {
  protected accountParsers: Record<
    string,
    DefinedParser<RawAccountInfo, RawAccountInfo | AlephParsedAccountInfo>
  > = {}

  /**
   * Parses a raw or partly-parsed account, if a parser for account is available.
   * @param payload The raw or partially-parsed account to parse.
   * @param address The address of the account.
   */
  async parse(
    payload: RawAccountInfo | AlephParsedAccountInfo,
    address: string,
  ): Promise<RawAccountInfo | AlephParsedAccountInfo> {
    const parser = await this.getParser(address)
    if (!parser) return payload

    const parsedData = await parser.parse(payload)
    return parsedData as AlephParsedAccountInfo
  }

  /**
   * Returns the parser for the given account address, if available.
   * @param address The address of the account.
   * @protected
   */
  protected async getParser(
    address: string,
  ): Promise<
    | DefinedParser<RawAccountInfo, RawAccountInfo | AlephParsedAccountInfo>
    | undefined
  > {
    let parser = this.accountParsers[address]
    if (parser) return parser

    const implementation = await LayoutFactory.getSingleton(address)
    if (!implementation) return

    parser = new AccountParser(implementation.accountDataLayoutMap)
    this.accountParsers[address] = parser

    return parser
  }
}
