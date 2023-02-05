import { EthereumLogParser } from '@aleph-indexer/ethereum'
import { BscClient } from '../../../sdk/client.js'
import { BscAbiFactory } from './abiFactory.js'

export class BscLogParser extends EthereumLogParser {
  constructor(
    protected abiFactory: BscAbiFactory,
    protected client: BscClient,
  ) {
    super(abiFactory, client)
  }
}
