import {
  BlockchainFetcherI,
  CheckEntityRequestArgs,
  DelEntityRequestArgs,
  FetcherState,
  FetcherStateRequestArgs,
  EntityState,
  AddAccountEntityRequestArgs,
  DelAccountEntityRequestArgs,
  GetAccountEntityStateRequestArgs,
  AccountEntityHistoryState,
  FetchAccountEntitiesByDateRequestArgs,
  FetchEntitiesByIdRequestArgs,
} from './types.js'
import { FetcherMsClient } from '../client.js'
import { BlockchainId, IndexableEntityType } from '../../../types.js'
import { BaseEntityFetcherMain } from './entityFetcherMain.js'
import { FetcherClientI } from '../interface.js'

/**
 * The main class of the fetcher service.
 */
export class BaseFetcher<
  EFM extends BaseEntityFetcherMain<unknown> = BaseEntityFetcherMain<unknown>,
> implements BlockchainFetcherI
{
  protected blockchainFetcherClient: FetcherClientI

  /**
   * Initialize the fetcher service.
   * @param blockchainId The blockchain identifier.
   * @param fetcherClient Allows communication with the sibling fetcher instances.
   * @param transactionHistoryFetcher It handles the account transactions tracking
   * @param transactionFetcher It handles transaction fetching by signatures
   * @param accountStateFetcher It handles the account state tracking
   */
  constructor(
    protected blockchainId: BlockchainId,
    protected fetcherClient: FetcherMsClient,
    protected entityFetchers: Partial<Record<IndexableEntityType, EFM>>,
  ) {
    this.blockchainFetcherClient = this.fetcherClient.useBlockchain(
      this.blockchainId,
    )
  }

  async start(): Promise<void> {
    const entityFetchers = Object.values(this.entityFetchers)

    await Promise.all(
      entityFetchers.map((entityFetcher) => entityFetcher.start()),
    )
  }

  async stop(): Promise<void> {
    const entityFetchers = Object.values(this.entityFetchers)

    await Promise.all(
      entityFetchers.map((entityFetcher) => entityFetcher.stop()),
    )
  }

  async addAccountEntityFetcher(
    args: AddAccountEntityRequestArgs,
  ): Promise<void> {
    const account = this.mapAccount(args)
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.addAccount({ ...args, account })
  }

  async delAccountEntityFetcher(
    args: DelAccountEntityRequestArgs,
  ): Promise<void> {
    const account = this.mapAccount(args)
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.delAccount({ ...args, account })
  }

  async getAccountEntityFetcherState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<AccountEntityHistoryState<any> | undefined> {
    const account = this.mapAccount(args)
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.getAccountState({ ...args, account })
  }

  async getFetcherState({
    fetcher = this.fetcherClient.getNodeId(),
    type,
  }: FetcherStateRequestArgs): Promise<FetcherState> {
    const fetchers =
      type && type.length > 0
        ? type.map((id) => this.getEntityFetcherInstance(id))
        : Object.values(this.entityFetchers)

    return Promise.all(
      fetchers.map(async (entityFetcher) => {
        return {
          blockchain: this.blockchainId,
          fetcher,
          ...(await entityFetcher.getState()),
        }
      }),
    )
  }

  async fetchAccountEntitiesByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    const account = this.mapAccount(args)
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.fetchAccountEntitiesByDate({ ...args, account })
  }

  async fetchEntitiesById(args: FetchEntitiesByIdRequestArgs): Promise<void> {
    const ids = this.mapEntityIds(args)
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.fetchEntitiesById({ ...args, ids })
  }

  async getEntityState(args: CheckEntityRequestArgs): Promise<EntityState[]> {
    const ids = this.mapEntityIds(args)
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.getEntityState({ ...args, ids })
  }

  async delEntityCache(args: DelEntityRequestArgs): Promise<void> {
    const ids = this.mapEntityIds(args)
    const entityFetcher = this.getEntityFetcherInstance(args.type)
    return entityFetcher.delEntityCache({ ...args, ids })
  }

  protected getEntityFetcherInstance(
    type: IndexableEntityType,
  ): BaseEntityFetcherMain<unknown> {
    const entityFetcher = this.entityFetchers[type]
    if (!entityFetcher) throw new Error('Entity fetcher not implemented.')

    return entityFetcher
  }

  protected getFetcherId(): string {
    return this.fetcherClient.getNodeId()
  }

  protected mapAccount(args: { account: string }): string {
    return this.blockchainFetcherClient.normalizeAccount(args.account)
  }

  protected mapEntityIds(args: {
    ids: string[]
    type: IndexableEntityType
  }): string[] {
    return args.ids.map((id) =>
      this.blockchainFetcherClient.normalizeEntityId(args.type, id),
    )
  }
}
