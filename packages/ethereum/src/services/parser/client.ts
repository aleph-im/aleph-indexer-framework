import {
  BaseParserClient,
  Blockchain,
  ParserClientI,
} from '@aleph-indexer/framework'
import { ServiceBroker } from 'moleculer'
import { EthereumRawAccountState, EthereumRawTransaction } from '../../types.js'
import {
  EthereumParsedAccountState,
  EthereumParsedTransaction,
} from './src/types.js'

export class EthereumParserClient extends BaseParserClient<
  EthereumRawTransaction,
  EthereumParsedTransaction,
  EthereumRawAccountState,
  EthereumParsedAccountState
> {}

export async function ethereumParserClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<
  ParserClientI<
    EthereumRawTransaction,
    EthereumParsedTransaction,
    EthereumRawAccountState,
    EthereumParsedAccountState
  >
> {
  return new EthereumParserClient(blockchainId, broker)
}
