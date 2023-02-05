import {
  BaseParserClient,
  Blockchain,
  ParserClientI,
} from '@aleph-indexer/framework'
import { ServiceBroker } from 'moleculer'
import { EthereumRawTransaction } from '../../types.js'
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
