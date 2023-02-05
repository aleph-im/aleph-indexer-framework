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
import { BscParsedLog } from '../../parser/src/types.js'

export class BscIndexerLogFetcher extends EthereumIndexerLogFetcher {
  constructor(
    protected fetcherMsClient: FetcherMsClient,
    protected logRequestDAL: EntityRequestStorage,
    protected logRequestIncomingLogDAL: EntityRequestIncomingEntityStorage<BscParsedLog>,
    protected logRequestPendingSignatureDAL: EntityRequestPendingEntityStorage,
    protected logRequestResponseDAL: EntityRequestResponseStorage<BscParsedLog>,
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
