import { Utils } from '@aleph-indexer/core'
import {
  FetcherMainDomainContext,
  FetcherState,
  SignatureFetcherState,
  TransactionState,
} from '../../../services/fetcher/src/types.js'

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
   * Returns the fetcher state for the given account-bound fetchers.
   * @param accounts The accounts of which to get the fetchers.
   */
  async getAccountFetcherState(
    accounts: string[] = [],
  ): Promise<SignatureFetcherState[]> {
    return (
      await Promise.all(
        accounts.map((account) =>
          this.context.apiClient.getAccountFetcherState({
            account,
          }),
        ),
      )
    ).filter((info): info is SignatureFetcherState => !!info)
  }

  /**
   * Returns the fetcher state for the given non-account related fetchers.
   * @param fetchers The fetchers to get the fetcher state for.
   */
  async getFetcherState(fetchers: string[] = []): Promise<FetcherState[]> {
    fetchers = fetchers.length
      ? fetchers
      : this.context.apiClient.getAllFetchers()

    return Promise.all(
      fetchers.map((fetcher) =>
        this.context.apiClient.getFetcherState({
          fetcher,
        }),
      ),
    )
  }

  /**
   * Returns the state of being fetched for the given transactions.
   * @param signatures The signatures of the transactions to get the state for.
   */
  async getTransactionState(
    signatures: string[] = [],
  ): Promise<TransactionState[]> {
    return this.context.apiClient.getTransactionState({
      signatures,
    })
  }
}
