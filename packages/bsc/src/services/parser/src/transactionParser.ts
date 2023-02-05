import { EthereumTransactionParser } from '@aleph-indexer/ethereum'
import { AbiFactory } from '@aleph-indexer/ethereum'
import { BscClient } from '../../../sdk/client.js'

export class BscTransactionParser extends EthereumTransactionParser {
  constructor(protected abiFactory: AbiFactory, protected client: BscClient) {
    super(abiFactory, client)
  }
}
