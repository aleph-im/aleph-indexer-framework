import {
  Blockchain,
  IndexableEntityType,
  ParsedEntity,
} from '../../../types.js'
import { FetcherMsClient } from '../../fetcher/client.js'
import { ParserMsClient } from '../../parser/client.js'
import { IndexerMsClient } from '../client.js'
import { BaseAccountEntityIndexer } from './accountEntityIndexer.js'
import { EntityIndexerStateStorage } from './dal/entityIndexerState.js'
import { EntityRequest } from './dal/entityRequest.js'
import { BaseIndexerEntityFetcher } from './entityFetcher.js'
import {
  AccountIndexerEntityRequestArgs,
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
   * @param type What entity type this indexer processes.
   * @param blockchainId The blockchain identifier.
   * @param domain The indexer domain class that handles all user requests.
   * @param fetcherClient Allows communication with the fetcher service.
   * @param indexerClient Allows communication with the sibling indexer instances.
   * @param parserClient Allows communication with the parser service.
   * @param entityIndexerStateDAL Stores the entity indexer state.
   * @param entityFetcher Fetches actual entity data by their signatures.
   */
  constructor(
    protected type: IndexableEntityType,
    protected blockchainId: Blockchain,
    protected domain: IndexerWorkerDomainI,
    protected indexerClient: IndexerMsClient,
    protected fetcherClient: FetcherMsClient,
    protected parserClient: ParserMsClient,
    protected entityIndexerStateDAL: EntityIndexerStateStorage,
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

  /**
   * Unregisters the onEntities event on the parser.
   * Stops the entity fetcher.
   */
  async stop(): Promise<void> {
    this.parserClient.off(
      `parser.${this.blockchainId}.${this.type}`,
      this.entityHandler,
    )

    await this.entityFetcher.stop().catch(() => 'ignore')
  }

  /**
   * Adds a new account indexer.
   * @param args Parameters such as the account address, the blockchain id, and chunking options.
   */
  async addAccount(args: AccountIndexerEntityRequestArgs): Promise<void> {
    const { account } = args

    let accountIndexer = this.accountIndexers[account]
    if (accountIndexer) return

    accountIndexer = new BaseAccountEntityIndexer<PE>(
      args,
      this.domain,
      this.fetcherClient,
      this.entityFetcher,
      this.entityIndexerStateDAL,
    )

    await accountIndexer.start()

    this.accountIndexers[account] = accountIndexer
  }

  /**
   * Removes an account indexer.
   * @param account The account address.
   */
  async delAccount(account: string): Promise<void> {
    const accountIndexer = this.accountIndexers[account]
    if (!accountIndexer) return

    await accountIndexer.stop()

    delete this.accountIndexers[account]
  }

  /**
   * Returns the state of an account indexer.
   * @param account The account address.
   */
  async getAccountState(account: string): Promise<AccountEntityIndexerState | undefined> {

    const indexer = this.accountIndexers[account]
    if (!indexer) return

    const state = await indexer.getIndexingState()
    if (!state) return

    state.indexer = this.indexerClient.getNodeId()
    return state
  }

  /**
   * Returns the state of pending requests.
   * @param filters Filters such as the account address, the blockchain id, and the entity type.
   */
  async getEntityPendingRequests(
    filters: GetEntityPendingRequestsRequestArgs,
  ): Promise<EntityRequest[]> {
    const requests = await this.entityFetcher.getRequests(filters)
    return this.mapWithIndexerId(requests)
  }

  /**
   * Hook to be called when new entities are received by the indexer.
   * @param chunk
   * @protected
   */
  protected async onEntities(chunk: PE[]): Promise<void> {
    console.log(
      `${this.blockchainId} ${this.type} | 💌 ${chunk.length} entities received by the indexer...`,
    )
    await this.entityFetcher.onEntities(chunk)
  }

  /**
   * Maps the items with the indexer id.
   * @param items The items to map.
   * @protected
   */
  protected mapWithIndexerId<T>(items: T[]): T[] {
    const indexer = this.indexerClient.getNodeId()
    return items.map((item) => {
      ;(item as any).indexer = indexer
      return item
    })
  }
}
