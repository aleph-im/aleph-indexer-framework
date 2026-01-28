import {
  BaseEntityHistoryFetcher,
  BlockchainId,
  GetAccountEntityStateRequestArgs,
  FetcherMsClient,
  FetcherStateLevelStorage,
  PendingAccountStorage,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import {
  EthereumAccountTransactionHistoryPaginationCursor,
  EthereumAccountTransactionHistoryState,
} from '../types.js'
import {
  EthereumAccountTransactionHistoryFetcher,
  EthereumAccountTransactionHistoryFetcherParams,
} from './accountTransactionHistoryFetcher.js'
import { EthereumBlockHistoryFetcher } from '../block/blockHistoryFetcher.js'
import { EthereumClient } from '../../../../sdk/client.js'
import {
  EthereumAccountTransactionHistoryEntity,
  EthereumAccountTransactionHistoryStorage,
} from './dal/accountTransactionHistory.js'

export class EthereumTransactionHistoryFetcher extends BaseEntityHistoryFetcher<
  EthereumAccountTransactionHistoryPaginationCursor,
  EthereumAccountTransactionHistoryEntity
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
    protected fetcherClient: FetcherMsClient,
    protected accountDAL: PendingAccountStorage,
    protected accountEntityHistoryDAL: EthereumAccountTransactionHistoryStorage,
  ) {
    super(
      blockchainId,
      IndexableEntityType.Transaction,
      fetcherClient,
      accountDAL,
      accountEntityHistoryDAL,
    )
  }

  /**
   * Returns the state of the transaction fetch process of a given account.
   * @param args The account address to get its fetch status.
   */
  async getAccountState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<EthereumAccountTransactionHistoryState | undefined> {
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
    params: EthereumAccountTransactionHistoryFetcherParams = {},
  ): EthereumAccountTransactionHistoryFetcher {
    return new EthereumAccountTransactionHistoryFetcher(
      account,
      params,
      this.blockchainId,
      this.fetcherStateDAL,
      this.ethereumClient,
      this.blockHistoryFetcher,
    )
  }
}
