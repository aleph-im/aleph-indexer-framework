import {
  BaseParser,
  IndexableEntityType,
  ParseEntityRequestArgs,
} from '@aleph-indexer/framework'
import { EthereumRawTransaction, EthereumRawLog } from '../../types.js'
import { EthereumAccountStateParser } from './src/accountStateParser.js'
import { EthereumTransactionParser } from './src/transactionParser.js'
import { EthereumParsedLog, EthereumParsedTransaction } from './src/types.js'

export class EthereumParser extends BaseParser<
  EthereumRawTransaction,
  EthereumParsedTransaction
> {
  constructor(
    protected transactionParser: EthereumTransactionParser,
    protected accountStateParser: EthereumAccountStateParser,
  ) {
    super()
  }

  async parseEntity(
    args: ParseEntityRequestArgs<EthereumRawTransaction>,
  ): Promise<any> {
    if (args.type === IndexableEntityType.Transaction)
      return this.parseTransaction(args)

    if (args.type !== IndexableEntityType.Log)
      return this.parseTransaction(args)

    return args.entity
  }

  async parseTransaction(
    args: ParseEntityRequestArgs<EthereumRawTransaction>,
  ): Promise<EthereumRawTransaction | EthereumParsedTransaction> {
    return this.transactionParser.parse(args.entity)
  }

  async parseLog(
    args: ParseEntityRequestArgs<EthereumRawLog>,
  ): Promise<EthereumRawLog | EthereumParsedLog> {
    // @todo: Implemente
    return args.entity
  }

  // async parseAccountState(
  //   args: ParseEntityRequestArgs<EthereumRawAccountState>,
  // ): Promise<EthereumRawAccountState | EthereumParsedAccountState> {
  //   return this.accountStateParser.parse(args.state, args.account)
  // }
}
