import {
  BlockchainId,
  IndexableEntityType,
  ParsedEntity,
} from '../../../types.js'
import { FetcherMsClient } from '../../fetcher/client.js'
import { ParserMsClient } from '../../parser/client.js'
import { IndexerMsClient } from '../client.js'
import { BaseAccountEntityIndexer } from './accountEntityIndexer.js'
import { EntityRequest } from './dal/entityRequest.js'
import { BaseIndexerEntityFetcher } from './entityFetcher.js'
import {
  AccountIndexerEntityRequestArgs,
  GetAccountIndexingEntityStateRequestArgs,
  IndexerWorkerDomainI,
  GetEntityPendingRequestsRequestArgs,
  AccountEntityIndexerState,
} from './types.js'

export class BaseEntityIndexer<
  PE extends ParsedEntity<unknown> = ParsedEntity<unknown>,
> {
  protected entityHandler: (chunk: PE[]) => Promise<void>
  protected accountIndexers: Record<string, BaseAccountEntityIndexer<PE>> = {}

  /**
   * @param blockchainId The blockchain identifier.
   * @param fetcherClient Allows communication with the fetcher service.
   * @param indexerClient Allows communication with the sibling indexer instances.
   * @param parserClient Allows communication with the parser service.
   * @param entityFetcher Fetches actual entity data by their signatures.
   */
  constructor(
    protected blockchainId: BlockchainId,
    protected type: IndexableEntityType,
    protected basePath: string,
    protected domain: IndexerWorkerDomainI,
    protected indexerClient: IndexerMsClient,
    protected fetcherClient: FetcherMsClient,
    protected parserClient: ParserMsClient,
    protected entityFetcher: BaseIndexerEntityFetcher<PE>,
  ) {
    this.entityHandler = this.onEntities.bind(this)
  }

  /**
   * Waits for the fetchers and parsers to be ready.
   * Registers the onEntities event on the parser,
   * such that it can parse ixns from the txns.
   */
  async start(): Promise<void> {
    await this.fetcherClient.waitForService()
    await this.parserClient.waitForService()

    this.parserClient.on(
      `parser.${this.blockchainId}.${this.type}`,
      this.entityHandler,
    )

    await this.entityFetcher.start().catch(() => 'ignore')
  }

  async stop(): Promise<void> {
    this.parserClient.off(
      `parser.${this.blockchainId}.${this.type}`,
      this.entityHandler,
    )

    await this.entityFetcher.stop().catch(() => 'ignore')
  }

  async addAccount(args: AccountIndexerEntityRequestArgs): Promise<void> {
    const { account } = args

    let accountIndexer = this.accountIndexers[account]
    if (accountIndexer) return

    accountIndexer = new BaseAccountEntityIndexer<PE>(
      args,
      this.basePath,
      this.domain,
      this.fetcherClient,
      this.entityFetcher,
    )

    await accountIndexer.start()

    this.accountIndexers[account] = accountIndexer
  }

  async delAccount(account: string): Promise<void> {
    const accountIndexer = this.accountIndexers[account]
    if (!accountIndexer) return

    await accountIndexer.stop()

    delete this.accountIndexers[account]
  }

  async getAccountState(
    args: GetAccountIndexingEntityStateRequestArgs,
  ): Promise<AccountEntityIndexerState | undefined> {
    const { account } = args

    const indexer = this.accountIndexers[account]
    if (!indexer) return

    const state = await indexer.getIndexingState()
    if (!state) return

    state.indexer = this.indexerClient.getNodeId()
    return state
  }

  async getEntityPendingRequests(
    filters: GetEntityPendingRequestsRequestArgs,
  ): Promise<EntityRequest[]> {
    const requests = await this.entityFetcher.getRequests(filters)
    return this.mapWithIndexerId(requests)
  }

  protected async onEntities(chunk: PE[]): Promise<void> {
    console.log(
      `${this.blockchainId} ${this.type} | 💌 ${chunk.length} entities received by the indexer...`,
    )
    await this.entityFetcher.onEntities(chunk)
  }

  protected mapWithIndexerId<T>(items: T[]): T[] {
    const indexer = this.indexerClient.getNodeId()
    return items.map((item) => {
      ;(item as any).indexer = indexer
      return item
    })
  }
}
