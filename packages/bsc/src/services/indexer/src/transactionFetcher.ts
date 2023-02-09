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
import { BscParsedTransaction } from '../../parser/src/types.js'

export class BscIndexerTransactionFetcher extends EthereumIndexerTransactionFetcher {
  constructor(
    protected fetcherMsClient: FetcherMsClient,
    protected transactionRequestDAL: EntityRequestStorage,
    protected transactionRequestIncomingTransactionDAL: EntityRequestIncomingEntityStorage<BscParsedTransaction>,
    protected transactionRequestPendingSignatureDAL: EntityRequestPendingEntityStorage,
    protected transactionRequestResponseDAL: EntityRequestResponseStorage<BscParsedTransaction>,
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
