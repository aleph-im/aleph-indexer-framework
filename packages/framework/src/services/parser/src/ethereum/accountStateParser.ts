import {
  EthereumRawAccountState,
  EthereumParsedAccountState,
} from '@aleph-indexer/core'
import { DefinedParser } from '../base/types.js'

export class EthereumAccountStateParser extends DefinedParser<
  EthereumRawAccountState,
  EthereumRawAccountState | EthereumParsedAccountState
> {
  protected accountParsers: Record<
    string,
    DefinedParser<
      EthereumRawAccountState,
      EthereumRawAccountState | EthereumParsedAccountState
    >
  > = {}

  async parse(
    payload: EthereumRawAccountState | EthereumParsedAccountState,
    address: string,
  ): Promise<EthereumRawAccountState | EthereumParsedAccountState> {
    // @note: noop
    return payload
  }
}
