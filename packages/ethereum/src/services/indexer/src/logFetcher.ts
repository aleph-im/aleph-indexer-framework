import {
  BaseIndexerEntityFetcher,
  Blockchain,
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
import { EthereumParsedLog } from '../../parser/src/types.js'

export class EthereumIndexerLogFetcher extends BaseIndexerEntityFetcher<EthereumParsedLog> {
  constructor(
    protected blockchainId: Blockchain,
    protected fetcherMsClient: FetcherMsClient,
    protected logRequestDAL: EntityRequestStorage,
    protected logRequestIncomingLogDAL: EntityRequestIncomingEntityStorage<EthereumParsedLog>,
    protected logRequestPendingSignatureDAL: EntityRequestPendingEntityStorage,
    protected logRequestResponseDAL: EntityRequestResponseStorage<EthereumParsedLog>,
    protected nonce: NonceTimestamp = new NonceTimestamp(),
  ) {
    super(
      IndexableEntityType.Log,
      blockchainId,
      fetcherMsClient,
      logRequestDAL,
      logRequestIncomingLogDAL,
      logRequestPendingSignatureDAL,
      logRequestResponseDAL,
      nonce,
    )
  }

  protected filterIncomingEntitiesByRequest(
    entities: EthereumParsedLog[],
    request: EntityRequest,
  ): {
    filteredEntities: EthereumParsedLog[]
    remainingEntities: EthereumParsedLog[]
  } {
    const filteredEntities: EthereumParsedLog[] = []
    const remainingEntities: EthereumParsedLog[] = []

    switch (request.type) {
      case EntityRequestType.ByDateRange: {
        const { account, startDate, endDate } = request.params

        for (const entity of entities) {
          if (typeof entity.parsed !== 'object') {
            console.log(
              'ethereum log | 👺 error incoming log without parsed field',
              request.nonce,
              entity,
            )
            continue
          }

          const timestamp = entity.timestamp
          let valid = timestamp >= startDate && timestamp <= endDate

          if (valid) {
            valid = entity.address.toLowerCase() === account

            if (!valid) {
              const accountTopic = `0x${account.substring(2).padStart(64, '0')}`
              valid = entity.topics.some((topic) => topic === accountTopic)
            }
          }

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
