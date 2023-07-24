import {
  Blockchain,
  FetcherMsClient,
  NonceTimestamp,
  EntityRequestIncomingEntityStorage,
  EntityRequestPendingEntityStorage,
  EntityRequestResponseStorage,
  EntityRequestStorage,
} from '@aleph-indexer/framework'
import { EthereumIndexerLogFetcher } from '@aleph-indexer/ethereum'
import { OasysParsedLog } from '../../parser/src/types.js'

export class OasysIndexerLogFetcher extends EthereumIndexerLogFetcher {
  constructor(
    protected fetcherMsClient: FetcherMsClient,
    protected logRequestDAL: EntityRequestStorage,
    protected logRequestIncomingLogDAL: EntityRequestIncomingEntityStorage<OasysParsedLog>,
    protected logRequestPendingSignatureDAL: EntityRequestPendingEntityStorage,
    protected logRequestResponseDAL: EntityRequestResponseStorage<OasysParsedLog>,
    protected blockchainId: Blockchain = Blockchain.Oasys,
    nonce?: NonceTimestamp,
  ) {
    super(
      fetcherMsClient,
      logRequestDAL,
      logRequestIncomingLogDAL,
      logRequestPendingSignatureDAL,
      logRequestResponseDAL,
      blockchainId,
      nonce,
    )
  }
}
