import { EthereumTransactionParser } from '@aleph-indexer/ethereum'
import { BscClient } from '../../../sdk/client.js'
import { BscAbiFactory } from './abiFactory.js'

export class BscTransactionParser extends EthereumTransactionParser {
  constructor(
    protected abiFactory: BscAbiFactory,
    protected client: BscClient,
  ) {
    super(abiFactory, client)
  }
}
