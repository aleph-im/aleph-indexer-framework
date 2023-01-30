import {
  AccountDateRange,
  BaseIndexerEntityFetcher,
  Blockchain,
  FetcherMsClient,
  GetEntityPendingRequestsRequestArgs,
  NonceTimestamp,
  IdRange,
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
    protected blockchainId: Blockchain,
    protected fetcherMsClient: FetcherMsClient,
    protected transactionRequestDAL: EntityRequestStorage,
    protected transactionRequestIncomingTransactionDAL: EntityRequestIncomingEntityStorage<EthereumParsedTransaction>,
    protected transactionRequestPendingSignatureDAL: EntityRequestPendingEntityStorage,
    protected transactionRequestResponseDAL: EntityRequestResponseStorage<EthereumParsedTransaction>,
    protected nonce: NonceTimestamp = new NonceTimestamp(),
  ) {
    super(
      IndexableEntityType.Transaction,
      blockchainId,
      fetcherMsClient,
      transactionRequestDAL,
      transactionRequestIncomingTransactionDAL,
      transactionRequestPendingSignatureDAL,
      transactionRequestResponseDAL,
      nonce,
    )
  }

  fetchEntitiesById(params: IdRange): Promise<number> {
    params.ids = params.ids.map((sig) => sig.toLocaleLowerCase())
    return super.fetchEntitiesById(params)
  }

  fetchAccountEntitiesByDate(params: AccountDateRange): Promise<number> {
    params.account = params.account.toLowerCase()
    return super.fetchAccountEntitiesByDate(params)
  }

  getRequests(
    filters?: GetEntityPendingRequestsRequestArgs,
  ): Promise<EntityRequest[]> {
    if (filters?.account) {
      filters.account = filters.account.toLowerCase()
    }

    if (filters?.id) {
      filters.id = filters.id.toLowerCase()
    }

    return super.getRequests(filters)
  }

  onEntities(chunk: EthereumParsedTransaction[]): Promise<void> {
    chunk = chunk.map((item) => {
      item.id = item.id.toLowerCase()
      return item
    })

    return super.onEntities(chunk)
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
              '👺 error incoming tx without parsed field',
              request.nonce,
              entity,
            )
            continue
          }

          const timestamp = (entity.timestamp || 0) * 1000

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
      case EntityRequestType.ById: {
        const { ids } = request.params
        const sigSet = new Set(ids)

        for (const entity of entities) {
          const valid = sigSet.has(entity.id.toLowerCase())

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
