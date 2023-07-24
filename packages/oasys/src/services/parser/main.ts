import { EthereumParser } from '@aleph-indexer/ethereum'
import { OasysAccountStateParser } from './src/accountStateParser.js'
import { OasysLogParser } from './src/logParser.js'
import { OasysTransactionParser } from './src/transactionParser.js'

export class OasysParser extends EthereumParser {
  constructor(
    protected transactionParser: OasysTransactionParser,
    protected logParser: OasysLogParser,
    protected accountStateParser: OasysAccountStateParser,
  ) {
    super(transactionParser, logParser, accountStateParser)
  }
}
