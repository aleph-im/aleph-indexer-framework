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
import { EthereumParsedTransaction } from '../../parser/src/types.js'

export class BscIndexerTransactionFetcher extends EthereumIndexerTransactionFetcher {
  constructor(
    protected fetcherMsClient: FetcherMsClient,
    protected transactionRequestDAL: EntityRequestStorage,
    protected transactionRequestIncomingTransactionDAL: EntityRequestIncomingEntityStorage<EthereumParsedTransaction>,
    protected transactionRequestPendingSignatureDAL: EntityRequestPendingEntityStorage,
    protected transactionRequestResponseDAL: EntityRequestResponseStorage<EthereumParsedTransaction>,
    protected blockchainId: Blockchain = Blockchain.Bsc,
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
