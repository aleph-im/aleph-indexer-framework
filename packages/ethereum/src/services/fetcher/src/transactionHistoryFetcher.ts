import {
  AddAccountTransactionRequestArgs,
  BaseTransactionHistoryFetcher,
  Blockchain,
  DelAccountTransactionRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetcherMsClient,
  FetcherStateLevelStorage,
  GetAccountTransactionStateRequestArgs,
  PendingAccountStorage,
} from '@aleph-indexer/framework'
import {
  EthereumAccountTransactionHistoryPaginationCursor,
  EthereumAccountTransactionHistoryState,
} from './types.js'
import { EthereumAccountTransactionHistoryFetcher } from './accountTransactionHistoryFetcher.js'
import { EthereumBlockHistoryFetcher } from './blockHistoryFetcher.js'
import { EthereumSignature } from '../../../types.js'
import { EthereumClient } from '../../../sdk/client.js'
import { EthereumAccountTransactionHistoryStorage } from '../../../sdk/dal.js'

export class EthereumTransactionHistoryFetcher extends BaseTransactionHistoryFetcher<
  EthereumAccountTransactionHistoryPaginationCursor,
  EthereumSignature
> {
  /**
   * Initialize the fetcher service.
   * @param ethereumClient The ethereum mainnet public RPC client to use.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected ethereumClient: EthereumClient,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected blockHistoryFetcher: EthereumBlockHistoryFetcher,
    ...args: [
      FetcherMsClient,
      EthereumAccountTransactionHistoryStorage,
      PendingAccountStorage,
    ]
  ) {
    super(Blockchain.Ethereum, ...args)
  }

  async addAccount(args: AddAccountTransactionRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.addAccount(args)
  }

  async delAccount(args: DelAccountTransactionRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.delAccount(args)
  }

  async fetchAccountTransactionsByDate(
    args: FetchAccountTransactionsByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    args.account = args.account.toLowerCase()
    return super.fetchAccountTransactionsByDate(args)
  }

  /**
   * Returns the state of the transaction fetch process of a given account.
   * @param args The account address to get its fetch status.
   */
  async getAccountState(
    args: GetAccountTransactionStateRequestArgs,
  ): Promise<EthereumAccountTransactionHistoryState | undefined> {
    args.account = args.account.toLowerCase()

    const state: EthereumAccountTransactionHistoryState | undefined =
      await this.getPartialAccountState(args)

    if (!state) return

    const forward = state.cursors?.forward
    if (forward) {
      state.lastTimestamp = forward.timestamp
      state.lastHeight = forward.height
      state.lastSignature = forward.signature
    }

    const backward = state.cursors?.backward
    if (backward) {
      state.firstTimestamp = backward.timestamp
      state.firstHeight = backward.height
      state.firstSignature = backward.signature
    }

    return state
  }

  protected getAccountFetcher(
    account: string,
  ): EthereumAccountTransactionHistoryFetcher {
    return new EthereumAccountTransactionHistoryFetcher(
      account,
      this.fetcherStateDAL,
      this.ethereumClient,
      this.blockHistoryFetcher,
    )
  }

  protected checkTransactionHistory(): void {
    this.pendingAccounts.skipNextSleep()
  }
}