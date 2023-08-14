import { Utils } from '@aleph-indexer/core'
import {
  FetcherMainDomainContext,
  AccountEntityHistoryState,
  FetcherState,
  EntityState,
} from '../../../services/fetcher/src/types.js'
import { BlockchainId, IndexableEntityType } from '../../../types.js'

/**
 * The main fetcher domain class.
 * Primary entry point for information about fetcher state for the indexer.
 */
export class FetcherMainDomain {
  protected discoverJob: Utils.JobRunner | undefined
  protected statsJob: Utils.JobRunner | undefined
  protected accounts: Set<string> = new Set()

  constructor(protected context: FetcherMainDomainContext) {}

  /**
   * Returns the fetcher state for the given non-account related fetchers.
   * @param fetchers The fetchers to get the fetcher state for.
   * @param blockchainId The blockchain id to get the blockchain fetcher instance
   */
  async getFetcherState(
    blockchainId: BlockchainId[] = this.context.apiClient.getAllBlockchains(),
    type: IndexableEntityType[] = Object.values(IndexableEntityType),
    fetchers: string[] = this.context.apiClient.getAllFetchers(),
  ): Promise<FetcherState[]> {
    return (
      await Promise.all(
        fetchers.map((fetcher) =>
          this.context.apiClient.getFetcherState({
            fetcher,
            blockchainId,
            type,
          }),
        ),
      )
    ).flatMap((x) => x)
  }

  /**
   * Returns the fetcher state for the given account-bound fetchers.
   * @param accounts The accounts of which to get the fetchers.
   */
  async getAccountEntityFetcherState<T>(
    blockchainId: BlockchainId,
    type: IndexableEntityType,
    accounts: string[] = [],
  ): Promise<AccountEntityHistoryState<T>[]> {
    return (
      await Promise.all(
        accounts.map((account) =>
          this.context.apiClient
            .useBlockchain(blockchainId)
            .getAccountEntityFetcherState({ type, account }),
        ),
      )
    ).filter((info): info is AccountEntityHistoryState<T> => !!info)
  }

  /**
   * Returns the state of being fetched for the given transactions.
   * @param signatures The signatures of the transactions to get the state for.
   */
  async getEntityState(
    blockchainId: BlockchainId,
    type: IndexableEntityType,
    ids: string[] = [],
  ): Promise<EntityState[]> {
    return this.context.apiClient
      .useBlockchain(blockchainId)
      .getEntityState({ type, ids })
  }

  /**
   * Force to delete the cached transaction (Useful when rpc nodes return flaw txs).
   * @param signatures The txn signatures to delete the cache for.
   */
  async delEntityCache(
    blockchainId: BlockchainId,
    type: IndexableEntityType,
    ids: string[] = [],
  ): Promise<boolean> {
    await this.context.apiClient
      .useBlockchain(blockchainId)
      .delEntityCache({ type, ids })

    return true
  }
}
