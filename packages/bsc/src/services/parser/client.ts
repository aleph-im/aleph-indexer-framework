import {
  BaseParserClient,
  Blockchain,
  ParserClientI,
} from '@aleph-indexer/framework'
import { ServiceBroker } from 'moleculer'
import { EthereumRawTransaction } from '../../types.js'
import { EthereumParsedTransaction } from './src/types.js'

export class EthereumParserClient extends BaseParserClient<
  EthereumRawTransaction,
  EthereumParsedTransaction
> {}

export async function ethereumParserClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<ParserClientI<EthereumRawTransaction, EthereumParsedTransaction>> {
  return new EthereumParserClient(blockchainId, broker)
}
