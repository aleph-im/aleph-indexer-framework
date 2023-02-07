import { ServiceBroker } from 'moleculer'
import {
  BaseParserClient,
  Blockchain,
  ParserClientI,
} from '@aleph-indexer/framework'
import { EthereumRawTransaction } from '@aleph-indexer/ethereum'
import { BscParsedTransaction } from './src/types.js'

export class EthereumParserClient extends BaseParserClient<
  EthereumRawTransaction,
  BscParsedTransaction
> {}

export async function bscParserClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<ParserClientI<EthereumRawTransaction, BscParsedTransaction>> {
  return new EthereumParserClient(blockchainId, broker)
}
