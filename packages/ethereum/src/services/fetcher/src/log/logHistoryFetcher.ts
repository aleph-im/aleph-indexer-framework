import {
  BlockchainId,
  GetAccountEntityStateRequestArgs,
  FetcherMsClient,
  FetcherStateLevelStorage,
  PendingAccountStorage,
  BaseEntityHistoryFetcher,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import { EthereumAccountLogHistoryFetcher } from './accountLogHistoryFetcher.js'
import { EthereumBlockHistoryFetcher } from '../block/blockHistoryFetcher.js'
import { EthereumClient } from '../../../../sdk/client.js'
import {
  EthereumAccountLogHistoryEntity,
  EthereumAccountLogHistoryStorage,
} from './dal/accountLogHistory.js'
import {
  EthereumAccountLogHistoryPaginationCursor,
  EthereumAccountLogHistoryState,
} from '../types.js'
import { EthereumRawLogStorage } from './dal/rawLog.js'

export class EthereumLogHistoryFetcher extends BaseEntityHistoryFetcher<
  EthereumAccountLogHistoryPaginationCursor,
  EthereumAccountLogHistoryEntity
> {
  /**
   * Initialize the fetcher service.
   * @param ethereumClient The ethereum mainnet public RPC client to use.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected blockchainId: BlockchainId,
    protected ethereumClient: EthereumClient,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected blockHistoryFetcher: EthereumBlockHistoryFetcher,
    protected rawLogDAL: EthereumRawLogStorage,
    protected fetcherClient: FetcherMsClient,
    protected accountDAL: PendingAccountStorage,
    protected accountLogHistoryDAL: EthereumAccountLogHistoryStorage,
  ) {
    super(
      blockchainId,
      IndexableEntityType.Log,
      fetcherClient,
      accountDAL,
      accountLogHistoryDAL,
    )
  }

  /**
   * Returns the state of the transaction fetch process of a given account.
   * @param args The account address to get its fetch status.
   */
  async getAccountState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<EthereumAccountLogHistoryState | undefined> {
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
      this.blockchainId,
      account,
      this.accountLogHistoryDAL,
      this.rawLogDAL,
      this.fetcherStateDAL,
      this.ethereumClient,
      this.blockHistoryFetcher,
    )
  }
}
