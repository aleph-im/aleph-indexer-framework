import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  IndexerWorkerDomainI,
  GetAccountIndexingEntityStateRequestArgs,
  DelAccountIndexerRequestArgs,
  GetEntityPendingRequestsRequestArgs,
} from './types.js'
import { BlockchainIndexerI } from './types.js'
import { Blockchain, IndexableEntityType } from '../../../types.js'
import { BaseEntityIndexer } from './entityIndexer.js'
import { EntityRequest } from './dal/entityRequest.js'

/**
 * Main class of the indexer service. Creates and manages all indexers.
 */
export abstract class BaseIndexer implements BlockchainIndexerI {
  /**
   * @param blockchainId The blockchain identifier.
   * @param domain The customized domain user class.
   * @param entityIndexers Handles all indexing process related with an specific entity
   */
  constructor(
    protected blockchainId: Blockchain,
    protected entityIndexers: Partial<
      Record<IndexableEntityType, BaseEntityIndexer>
    >,
    protected domain: IndexerWorkerDomainI,
  ) {}

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
    const { account, blockchainId, index } = args
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

    await this.domain.onNewAccount(args)
  }

  async deleteAccount(args: DelAccountIndexerRequestArgs): Promise<void> {
    const { account, index } = args
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
    const indexer = this.getEntityIndexerInstance(args.type)
    return indexer.getAccountState(args)
  }

  async getEntityPendingRequests(
    args: GetEntityPendingRequestsRequestArgs,
  ): Promise<EntityRequest[]> {
    const indexer = this.getEntityIndexerInstance(args.type)
    return indexer.getEntityPendingRequests(args)
  }

  protected getEntityIndexerInstance(
    type: IndexableEntityType,
  ): BaseEntityIndexer {
    const entityIndexer = this.entityIndexers[type]
    if (!entityIndexer) throw new Error('Entity indexer not implemented.')

    return entityIndexer
  }
}
