import {
  BaseIndexerEntityFetcher,
  BlockchainId,
  FetcherMsClient,
  NonceTimestamp,
  EntityRequest,
  EntityRequestIncomingEntityStorage,
  EntityRequestPendingEntityStorage,
  EntityRequestResponseStorage,
  EntityRequestStorage,
  EntityRequestType,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import { EthereumParsedTransaction } from '../../parser/src/types.js'

export class EthereumIndexerTransactionFetcher extends BaseIndexerEntityFetcher<EthereumParsedTransaction> {
  constructor(
    protected blockchainId: BlockchainId,
    protected fetcherMsClient: FetcherMsClient,
    protected transactionRequestDAL: EntityRequestStorage,
    protected transactionRequestIncomingTransactionDAL: EntityRequestIncomingEntityStorage<EthereumParsedTransaction>,
    protected transactionRequestPendingSignatureDAL: EntityRequestPendingEntityStorage,
    protected transactionRequestResponseDAL: EntityRequestResponseStorage<EthereumParsedTransaction>,
    protected nonce: NonceTimestamp = new NonceTimestamp(),
  ) {
    super(
      blockchainId,
      IndexableEntityType.Transaction,
      fetcherMsClient,
      transactionRequestDAL,
      transactionRequestIncomingTransactionDAL,
      transactionRequestPendingSignatureDAL,
      transactionRequestResponseDAL,
      nonce,
    )
  }

  protected filterIncomingEntitiesByRequest(
    entities: EthereumParsedTransaction[],
    request: EntityRequest,
  ): {
    filteredEntities: EthereumParsedTransaction[]
    remainingEntities: EthereumParsedTransaction[]
  } {
    const filteredEntities: EthereumParsedTransaction[] = []
    const remainingEntities: EthereumParsedTransaction[] = []

    switch (request.type) {
      case EntityRequestType.ByDateRange: {
        const { account, startDate, endDate } = request.params

        for (const entity of entities) {
          if (typeof entity.parsed !== 'object') {
            console.log(
              'ethereum transaction | 👺 error incoming tx without parsed field',
              request.nonce,
              entity,
            )
            continue
          }

          const timestamp = entity.timestamp
          let valid = timestamp >= startDate && timestamp <= endDate

          valid =
            valid &&
            [entity.from, entity.to].some(
              (address) => address?.toLowerCase() === account,
            )

          valid ? filteredEntities.push(entity) : remainingEntities.push(entity)
        }

        break
      }
      default: {
        return super.filterIncomingEntitiesByRequest(entities, request)
      }
    }

    return { filteredEntities, remainingEntities }
  }
}
