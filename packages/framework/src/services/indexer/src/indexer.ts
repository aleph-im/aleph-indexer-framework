import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  IndexerWorkerDomainI,
  GetAccountIndexingEntityStateRequestArgs,
  DelAccountIndexerRequestArgs,
  GetEntityPendingRequestsRequestArgs,
} from './types.js'
import { BlockchainIndexerI } from './types.js'
import { BlockchainId, IndexableEntityType } from '../../../types.js'
import { BaseEntityIndexer } from './entityIndexer.js'
import { EntityRequest } from './dal/entityRequest.js'
import { IndexerMsClient } from '../client.js'
import { IndexerClientI } from '../interface.js'

/**
 * Main class of the indexer service. Creates and manages all indexers.
 */
export class BaseIndexer<BEI extends BaseEntityIndexer = BaseEntityIndexer>
  implements BlockchainIndexerI
{
  protected blockchainIndexerClient: IndexerClientI

  /**
   * Returns the main indexer instance.
   * @param blockchainId The blockchain identifier.
   * @param indexerClient The indexer client.
   * @param domain The customized domain user class.
   * @param entityIndexers Handles all indexing process related with an specific entity
   */
  constructor(
    protected blockchainId: BlockchainId,
    protected indexerClient: IndexerMsClient,
    protected entityIndexers: Partial<Record<IndexableEntityType, BEI>>,
    protected domain: IndexerWorkerDomainI,
  ) {
    this.blockchainIndexerClient = this.indexerClient.useBlockchain(
      this.blockchainId,
    )
  }

  async start(): Promise<void> {
    const entityIndexers = Object.values(this.entityIndexers)

    await Promise.all(
      entityIndexers.map((entityIndexer) => entityIndexer.start()),
    )
  }

  async stop(): Promise<void> {
    const entityIndexers = Object.values(this.entityIndexers)

    await Promise.all(
      entityIndexers.map((entityIndexer) => entityIndexer.stop()),
    )
  }

  async indexAccount(args: AccountIndexerRequestArgs): Promise<void> {
    const account = this.mapAccount(args)
    const { blockchainId, index } = args
    const { transactions, logs, state } = index
    const { Transaction, Log, State } = IndexableEntityType

    if (transactions) {
      await this.getEntityIndexerInstance(Transaction).addAccount({
        type: Transaction,
        blockchainId,
        account,
        ...(typeof transactions !== 'boolean'
          ? transactions
          : { chunkDelay: 0, chunkTimeframe: 1000 * 60 * 60 * 24 }),
      })
    }

    if (logs) {
      await this.getEntityIndexerInstance(Log).addAccount({
        type: Log,
        blockchainId,
        account,
        ...(typeof logs !== 'boolean'
          ? logs
          : { chunkDelay: 0, chunkTimeframe: 1000 * 60 * 60 * 24 }),
      })
    }

    if (state) {
      await this.getEntityIndexerInstance(State).addAccount({
        type: Log,
        blockchainId,
        account,
        ...(typeof state !== 'boolean'
          ? state
          : { chunkDelay: 1000 * 60 * 60, chunkTimeframe: 1000 * 60 * 60 }),
      })
    }

    await this.domain.onNewAccount({ ...args, account })
  }

  async deleteAccount(args: DelAccountIndexerRequestArgs): Promise<void> {
    const account = this.mapAccount(args)
    const { index } = args
    const { transactions, logs, state } = index
    const { Transaction, Log, State } = IndexableEntityType

    if (transactions) {
      await this.getEntityIndexerInstance(Transaction).delAccount(account)
    }

    if (logs) {
      await this.getEntityIndexerInstance(Log).delAccount(account)
    }

    if (state) {
      await this.getEntityIndexerInstance(State).delAccount(account)
    }
  }

  async getAccountState(
    args: GetAccountIndexingEntityStateRequestArgs,
  ): Promise<AccountIndexerState | undefined> {
    const account = this.mapAccount(args)
    const indexer = this.getEntityIndexerInstance(args.type)
    return indexer.getAccountState({ ...args, account })
  }

  async getEntityPendingRequests(
    args: GetEntityPendingRequestsRequestArgs,
  ): Promise<EntityRequest[]> {
    const account = args.account
      ? this.mapAccount(args as { account: string })
      : args.account

    const id = args.id
      ? this.mapEntityId(args as { id: string; type: IndexableEntityType })
      : args.id

    const indexer = this.getEntityIndexerInstance(args.type)
    return indexer.getEntityPendingRequests({ ...args, id, account })
  }

  protected getEntityIndexerInstance(
    type: IndexableEntityType,
  ): BaseEntityIndexer {
    const entityIndexer = this.entityIndexers[type]
    if (!entityIndexer) throw new Error('Entity indexer not implemented.')

    return entityIndexer
  }

  protected mapAccount(args: { account: string }): string {
    return this.blockchainIndexerClient.normalizeAccount(args.account)
  }

  protected mapEntityId(args: {
    id: string
    type: IndexableEntityType
  }): string {
    return this.blockchainIndexerClient.normalizeEntityId(args.type, args.id)
  }
}
