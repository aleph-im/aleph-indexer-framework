import { DefinedParser } from '@aleph-indexer/framework'
import { EthereumRawAccountState } from '../../../types.js'
import { EthereumParsedAccountState } from './types.js'

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
