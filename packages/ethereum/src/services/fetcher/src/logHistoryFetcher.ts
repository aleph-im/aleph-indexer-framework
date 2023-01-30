import {
  Blockchain,
  AddAccountEntityRequestArgs,
  DelAccountEntityRequestArgs,
  GetAccountEntityStateRequestArgs,
  FetchAccountEntitiesByDateRequestArgs,
  FetcherMsClient,
  FetcherStateLevelStorage,
  PendingAccountStorage,
  BaseEntityHistoryFetcher,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import { EthereumAccountLogHistoryFetcher } from './accountLogHistoryFetcher.js'
import { EthereumBlockHistoryFetcher } from './blockHistoryFetcher.js'
import { EthereumRawLog } from '../../../types.js'
import { EthereumClient } from '../../../sdk/client.js'
import { EthereumAccountLogHistoryStorage } from './dal/accountLogHistory.js'
import {
  EthereumAccountLogHistoryPaginationCursor,
  EthereumAccountLogHistoryState,
} from './types.js'

export class EthereumLogHistoryFetcher extends BaseEntityHistoryFetcher<
  EthereumAccountLogHistoryPaginationCursor,
  EthereumRawLog
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
      PendingAccountStorage,
      EthereumAccountLogHistoryStorage,
    ]
  ) {
    super(IndexableEntityType.Log, Blockchain.Ethereum, ...args)
  }

  async addAccount(args: AddAccountEntityRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.addAccount(args)
  }

  async delAccount(args: DelAccountEntityRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.delAccount(args)
  }

  async fetchAccountEntitiesByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    args.account = args.account.toLowerCase()
    return super.fetchAccountEntitiesByDate(args)
  }

  /**
   * Returns the state of the transaction fetch process of a given account.
   * @param args The account address to get its fetch status.
   */
  async getAccountState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<EthereumAccountLogHistoryState | undefined> {
    args.account = args.account.toLowerCase()

    const state: EthereumAccountLogHistoryState | undefined =
      await this.getPartialAccountState(args)

    if (!state) return

    const forward = state.cursors?.forward
    if (forward) {
      state.lastTimestamp = forward.timestamp
      state.lastHeight = forward.height
    }

    const backward = state.cursors?.backward
    if (backward) {
      state.firstTimestamp = backward.timestamp
      state.firstHeight = backward.height
    }

    return state
  }

  protected getAccountFetcher(
    account: string,
  ): EthereumAccountLogHistoryFetcher {
    return new EthereumAccountLogHistoryFetcher(
      account,
      this.fetcherStateDAL,
      this.ethereumClient,
      this.blockHistoryFetcher,
    )
  }
}
