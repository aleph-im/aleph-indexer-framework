import { EthereumTransactionParser } from '@aleph-indexer/ethereum'
import { OasysClient } from '../../../sdk/client.js'
import { OasysAbiFactory } from './abiFactory.js'

export class OasysTransactionParser extends EthereumTransactionParser {
  constructor(
    protected abiFactory: OasysAbiFactory,
    protected client: OasysClient,
  ) {
    super(abiFactory, client)
  }
}
