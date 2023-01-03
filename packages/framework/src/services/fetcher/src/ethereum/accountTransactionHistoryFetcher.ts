import {
  EthereumAccountTransactionHistoryFetcher as BaseFetcher,
  FetcherStateLevelStorage,
  EthereumSignature,
  EthereumBlockHistoryFetcher,
  EthereumClient,
} from '@aleph-indexer/core'

/**
 * Fetches signatures for a given account. Needs to be initialized and started with init() and run() respectively.
 */
export class EthereumAccountTransactionHistoryFetcher extends BaseFetcher {
  /**
   * Initializes the signature fetcher.
   * @param account The account account to fetch related signatures for.
   * @param ethereumClient The Solana RPC client.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected account: string,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected ethereumClient: EthereumClient,
    protected ethereumBlockFetcher: EthereumBlockHistoryFetcher,
  ) {
    super(
      {
        account,
        forward: true,
        backward: true,
        indexSignatures: (...args) => this.indexSignatures(...args),
      },
      fetcherStateDAL,
      ethereumClient,
      ethereumBlockFetcher,
    )
  }

  protected async indexSignatures(
    signatures: EthereumSignature[],
    goingForward: boolean,
  ): Promise<void> {
    // @note: Already indexed on the ethereumClient
    // @note: This is used just to track the sync state of each account independently
    return
  }
}
