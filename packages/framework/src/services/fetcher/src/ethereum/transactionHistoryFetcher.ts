import {
  FetcherStateLevelStorage,
  EthereumAccountTransactionHistoryPaginationCursor,
  EthereumAccountTransactionHistoryStorage,
  Blockchain,
  EthereumClient,
  EthereumSignature,
} from '@aleph-indexer/core'

import { BaseTransactionHistoryFetcher } from '../base/transactionHistoryFetcher.js'
import { GetAccountTransactionStateRequestArgs } from '../base/types.js'
import { EthereumAccountTransactionHistoryState } from './types.js'
import { EthereumAccountTransactionHistoryFetcher } from './accountTransactionHistoryFetcher.js'
import { PendingAccountStorage } from '../base/dal/account.js'
import { FetcherMsClient } from '../../client.js'
import { EthereumBlockFetcher } from './blockFetcher.js'

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
    protected blockFetcher: EthereumBlockFetcher,
    ...args: [
      FetcherMsClient,
      EthereumAccountTransactionHistoryStorage,
      PendingAccountStorage,
    ]
  ) {
    super(Blockchain.Ethereum, ...args)
  }

  /**
   * Returns the state of the transaction fetch process of a given account.
   * @param args The account address to get its fetch status.
   */
  async getAccountState(
    args: GetAccountTransactionStateRequestArgs,
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
  ): EthereumAccountTransactionHistoryFetcher {
    return new EthereumAccountTransactionHistoryFetcher(
      account,
      this.fetcherStateDAL,
      this.ethereumClient,
      this.blockFetcher,
    )
  }
}
