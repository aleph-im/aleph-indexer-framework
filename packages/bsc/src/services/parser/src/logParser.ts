import { AbiFactory } from '@aleph-indexer/ethereum'
import { EthereumLogParser } from '@aleph-indexer/ethereum'
import { BscClient } from '../../../sdk/client.js'

export class BscLogParser extends EthereumLogParser {
  constructor(protected abiFactory: AbiFactory, protected client: BscClient) {
    super(abiFactory, client)
  }
}
