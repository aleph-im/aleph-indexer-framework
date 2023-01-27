import {
  BaseParser,
  ParseAccountStateRequestArgs,
  ParseTransactionRequestArgs,
} from '@aleph-indexer/framework'
import { EthereumRawTransaction, EthereumRawAccountState } from '../../types.js'
import { EthereumAccountStateParser } from './src/accountStateParser.js'
import { EthereumTransactionParser } from './src/transactionParser.js'
import {
  EthereumParsedTransaction,
  EthereumParsedAccountState,
} from './src/types.js'

export class EthereumParser extends BaseParser<
  EthereumRawTransaction,
  EthereumParsedTransaction,
  EthereumRawAccountState,
  EthereumParsedAccountState
> {
  constructor(
    protected transactionParser: EthereumTransactionParser,
    protected accountStateParser: EthereumAccountStateParser,
  ) {
    super()
  }

  async parseTransaction(
    args: ParseTransactionRequestArgs<EthereumRawTransaction>,
  ): Promise<EthereumRawTransaction | EthereumParsedTransaction> {
    return this.transactionParser.parse(args.tx)
  }

  async parseAccountState(
    args: ParseAccountStateRequestArgs<EthereumRawAccountState>,
  ): Promise<EthereumRawAccountState | EthereumParsedAccountState> {
    return this.accountStateParser.parse(args.state, args.account)
  }
}
