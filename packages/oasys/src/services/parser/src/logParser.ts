import { EthereumLogParser } from '@aleph-indexer/ethereum'
import { OasysClient } from '../../../sdk/client.js'
import { OasysAbiFactory } from './abiFactory.js'

export class OasysLogParser extends EthereumLogParser {
  constructor(
    protected abiFactory: OasysAbiFactory,
    protected client: OasysClient,
  ) {
    super(abiFactory, client)
  }
}
