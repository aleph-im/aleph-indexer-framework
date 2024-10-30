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
import { SolanaParsedTransaction } from '../../../types.js'

export class SolanaIndexerTransactionFetcher extends BaseIndexerEntityFetcher<SolanaParsedTransaction> {
  constructor(
    protected blockchainId: BlockchainId,
    protected fetcherMsClient: FetcherMsClient,
    protected transactionRequestDAL: EntityRequestStorage,
    protected transactionRequestIncomingTransactionDAL: EntityRequestIncomingEntityStorage<SolanaParsedTransaction>,
    protected transactionRequestPendingSignatureDAL: EntityRequestPendingEntityStorage,
    protected transactionRequestResponseDAL: EntityRequestResponseStorage<SolanaParsedTransaction>,
    protected nonce: NonceTimestamp,
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
    entities: SolanaParsedTransaction[],
    request: EntityRequest,
  ): {
    filteredEntities: SolanaParsedTransaction[]
    remainingEntities: SolanaParsedTransaction[]
  } {
    const filteredEntities: SolanaParsedTransaction[] = []
    const remainingEntities: SolanaParsedTransaction[] = []

    switch (request.type) {
      case EntityRequestType.ByDateRange: {
        const { account, startDate, endDate } = request.params

        for (const tx of entities) {
          if (!tx.parsed) {
            console.log(
              `${this.blockchainId} transaction | 👺 error incoming tx without parsed field`,
              request.nonce,
              tx,
            )
            continue
          }

          const timestamp = tx.timestamp

          let valid = timestamp >= startDate && timestamp <= endDate

          valid =
            valid &&
            tx.parsed.message.accountKeys.some(
              ({ pubkey }) => pubkey === account,
            )

          valid ? filteredEntities.push(tx) : remainingEntities.push(tx)
        }

        break
      }
      case EntityRequestType.ById: {
        const { ids } = request.params
        const sigSet = new Set(ids)

        for (const tx of entities) {
          const valid = sigSet.has(tx.signature)

          valid ? filteredEntities.push(tx) : remainingEntities.push(tx)
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
