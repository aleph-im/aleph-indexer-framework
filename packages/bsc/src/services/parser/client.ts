import { ServiceBroker } from 'moleculer'
import { Blockchain, ParserClientI } from '@aleph-indexer/framework'
import { EthereumParserClient } from '@aleph-indexer/ethereum'
import { BscParsedTransaction, BscRawTransaction } from './src/types.js'

export class BscParserClient extends EthereumParserClient<
  BscRawTransaction,
  BscParsedTransaction
> {}

export async function bscParserClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<ParserClientI<BscRawTransaction, BscParsedTransaction>> {
  return new BscParserClient(blockchainId, broker)
}
