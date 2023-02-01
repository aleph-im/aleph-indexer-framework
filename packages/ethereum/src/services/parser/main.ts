import {
  BaseParser,
  IndexableEntityType,
  ParseEntityRequestArgs,
} from '@aleph-indexer/framework'
import { EthereumRawTransaction, EthereumRawLog } from '../../types.js'
import { EthereumAccountStateParser } from './src/accountStateParser.js'
import { EthereumLogParser } from './src/logParser.js'
import { EthereumTransactionParser } from './src/transactionParser.js'
import { EthereumParsedLog, EthereumParsedTransaction } from './src/types.js'

export class EthereumParser extends BaseParser<
  EthereumRawTransaction,
  EthereumParsedTransaction
> {
  constructor(
    protected transactionParser: EthereumTransactionParser,
    protected logParser: EthereumLogParser,
    protected accountStateParser: EthereumAccountStateParser,
  ) {
    super()
  }

  async parseEntity(args: ParseEntityRequestArgs<any>): Promise<any> {
    if (args.type === IndexableEntityType.Transaction) {
      return this.parseTransaction(args)
    }

    if (args.type === IndexableEntityType.Log) {
      return this.parseLog(args)
    }

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
    return this.logParser.parse(args.entity)
  }

  // async parseAccountState(
  //   args: ParseEntityRequestArgs<EthereumRawAccountState>,
  // ): Promise<EthereumRawAccountState | EthereumParsedAccountState> {
  //   return this.accountStateParser.parse(args.state, args.account)
  // }
}
