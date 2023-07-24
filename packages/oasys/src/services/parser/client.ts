import { ServiceBroker } from 'moleculer'
import { Blockchain, ParserClientI } from '@aleph-indexer/framework'
import { EthereumParserClient } from '@aleph-indexer/ethereum'
import { OasysParsedTransaction, OasysRawTransaction } from './src/types.js'

export class OasysParserClient extends EthereumParserClient<
  OasysRawTransaction,
  OasysParsedTransaction
> {}

export async function oasysParserClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<ParserClientI<OasysRawTransaction, OasysParsedTransaction>> {
  return new OasysParserClient(blockchainId, broker)
}
