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
import { EthereumParsedLog } from '../../parser/src/types.js'

export class BscIndexerLogFetcher extends EthereumIndexerLogFetcher {
  constructor(
    protected fetcherMsClient: FetcherMsClient,
    protected logRequestDAL: EntityRequestStorage,
    protected logRequestIncomingLogDAL: EntityRequestIncomingEntityStorage<EthereumParsedLog>,
    protected logRequestPendingSignatureDAL: EntityRequestPendingEntityStorage,
    protected logRequestResponseDAL: EntityRequestResponseStorage<EthereumParsedLog>,
    protected blockchainId: Blockchain = Blockchain.Bsc,
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
