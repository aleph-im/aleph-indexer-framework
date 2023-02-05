import { EthereumParser } from '@aleph-indexer/ethereum'
import { BscAccountStateParser } from './src/accountStateParser.js'
import { BscLogParser } from './src/logParser.js'
import { BscTransactionParser } from './src/transactionParser.js'

export class BscParser extends EthereumParser {
  constructor(
    protected transactionParser: BscTransactionParser,
    protected logParser: BscLogParser,
    protected accountStateParser: BscAccountStateParser,
  ) {
    super(transactionParser, logParser, accountStateParser)
  }
}
