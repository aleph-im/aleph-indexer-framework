import { BaseParser } from '../base/parser.js'
import { EthereumAccountStateParser } from './accountStateParser.js'
import { EthereumTransactionParser } from './transactionParser.js'
import {
  ParseAccountStateRequestArgs,
  ParseTransactionRequestArgs,
} from '../base/types.js'
import {
  EthereumRawAccountState,
  EthereumRawTransaction,
} from '../../../../types/ethereum.js'
import {
  EthereumParsedAccountState,
  EthereumParsedTransaction,
} from './types.js'

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
