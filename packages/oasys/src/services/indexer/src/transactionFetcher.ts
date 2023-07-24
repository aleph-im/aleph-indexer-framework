import {
  Blockchain,
  FetcherMsClient,
  NonceTimestamp,
  EntityRequestIncomingEntityStorage,
  EntityRequestPendingEntityStorage,
  EntityRequestResponseStorage,
  EntityRequestStorage,
} from '@aleph-indexer/framework'
import { EthereumIndexerTransactionFetcher } from '@aleph-indexer/ethereum'
import { OasysParsedTransaction } from '../../parser/src/types.js'

export class OasysIndexerTransactionFetcher extends EthereumIndexerTransactionFetcher {
  constructor(
    protected fetcherMsClient: FetcherMsClient,
    protected transactionRequestDAL: EntityRequestStorage,
    protected transactionRequestIncomingTransactionDAL: EntityRequestIncomingEntityStorage<OasysParsedTransaction>,
    protected transactionRequestPendingSignatureDAL: EntityRequestPendingEntityStorage,
    protected transactionRequestResponseDAL: EntityRequestResponseStorage<OasysParsedTransaction>,
    protected blockchainId: Blockchain = Blockchain.Oasys,
    protected nonce: NonceTimestamp = new NonceTimestamp(),
  ) {
    super(
      fetcherMsClient,
      transactionRequestDAL,
      transactionRequestIncomingTransactionDAL,
      transactionRequestPendingSignatureDAL,
      transactionRequestResponseDAL,
      blockchainId,
      nonce,
    )
  }
}
