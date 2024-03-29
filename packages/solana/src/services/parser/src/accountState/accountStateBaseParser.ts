import { DefinedParser } from '@aleph-indexer/framework'
import { RawAccountInfo, AlephParsedAccountInfo } from '../../../../types.js'

export class SolanaAccountStateBaseParser extends DefinedParser<
  RawAccountInfo,
  RawAccountInfo | AlephParsedAccountInfo
> {
  constructor(protected accountDataLayouts: any) {
    super()
  }

  parse(rawAccount: RawAccountInfo): RawAccountInfo | AlephParsedAccountInfo {
    const data = this.getAccountData(rawAccount)
    if (!data) return rawAccount

    const parsedAccount: AlephParsedAccountInfo = rawAccount as any
    parsedAccount.parsed = this.parseAccountData(data)

    return parsedAccount
  }

  protected getAccountData(
    rawAccount: RawAccountInfo | AlephParsedAccountInfo,
  ): Buffer | undefined {
    if (!('data' in rawAccount)) return
    return rawAccount.data
  }

  protected parseAccountData(data: Buffer): any {
    try {
      const template = this.accountDataLayouts
      if (!template) return {}

      return this.accountDataLayouts.decode(data)
    } catch (e) {
      console.error(e)
    }
  }
}
