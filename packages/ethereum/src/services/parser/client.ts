import {
  BaseParserClient,
  BlockchainId,
  ParserClientI,
} from '@aleph-indexer/framework'
import { ServiceBroker } from 'moleculer'
import { EthereumRawTransaction } from '../../types.js'
import { EthereumParsedTransaction } from './src/types.js'

export class EthereumParserClient<
  R extends EthereumRawTransaction = EthereumRawTransaction,
  P extends EthereumParsedTransaction = EthereumParsedTransaction,
> extends BaseParserClient<R, P> {}

export async function ethereumParserClientFactory(
  blockchainId: BlockchainId,
  broker: ServiceBroker,
): Promise<ParserClientI<EthereumRawTransaction, EthereumParsedTransaction>> {
  return new EthereumParserClient(blockchainId, broker)
}
