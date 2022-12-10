import {
  AddAccountFetcherRequestArgs,
  DelAccountFetcherRequestArgs,
  GetAccountFetcherStateRequestArgs,
  SolanaSignatureFetcherState,
} from './types'

export interface BlockchainFetcherI {
  start(): Promise<void>

  stop(): Promise<void>

  /**
   * Requests a new signature fetcher, which will fetch all txn signatures including a given account.
   * @param args Arguments for the fetcher.
   */
  addAccountFetcher(args: AddAccountFetcherRequestArgs): Promise<void>

  /**
   * Returns a signature fetcher's state.
   * @param args The account to get the fetcher's state from.
   */
  getAccountFetcherState(
    args: GetAccountFetcherStateRequestArgs,
  ): Promise<SolanaSignatureFetcherState | undefined>

  /**
   * Requests to remove a signature fetcher.
   * @param args The account to remove the fetcher from.
   */
  delAccountFetcher(args: DelAccountFetcherRequestArgs): Promise<void>
}
