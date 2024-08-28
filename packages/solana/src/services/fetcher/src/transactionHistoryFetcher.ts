import {
  BaseEntityHistoryFetcher,
  BlockchainId,
  FetcherMsClient,
  FetcherStateLevelStorage,
  GetAccountEntityStateRequestArgs,
  IndexableEntityType,
  PendingAccountStorage,
} from '@aleph-indexer/framework'
import { SolanaAccountTransactionHistoryStorage } from './dal/accountTransactionHistory.js'
import {
  SolanaAccountTransactionHistoryPaginationCursor,
  SolanaAccountEntityHistoryState,
  SolanaSignature,
} from './types.js'
import { SolanaAccountTransactionHistoryFetcher } from './accountTransactionHistoryFetcher.js'
import { SolanaRPC } from '../../../sdk/client.js'

export class SolanaTransactionHistoryFetcher extends BaseEntityHistoryFetcher<
  SolanaAccountTransactionHistoryPaginationCursor,
  SolanaSignature
> {
  /**
   * Initialize the fetcher service.
   * @param solanaRpc The solana RPC client to use.
   * @param solanaMainPublicRpc The solana mainnet public RPC client to use.
   * @param fetcherStateDAL The fetcher state storage.
   * @param args The fetcher client and the account and transaction history storage.
   */
  constructor(
    protected blockchainId: BlockchainId,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    ...args: [
      FetcherMsClient,
      PendingAccountStorage,
      SolanaAccountTransactionHistoryStorage,
    ]
  ) {
    super(blockchainId, IndexableEntityType.Transaction, ...args)
  }

  /**
   * Fetch transactions from an account by slot.
   * @param args accountAddress, startDate, endDate and indexerId.
   */
  // async fetchAccountTransactionsBySlot(
  //   args: FetchAccountTransactionsBySlotRequestArgs,
  // ): Promise<void | AsyncIterable<string[]>> {
  //   const { account, startSlot, endSlot, indexerId } = args

  //   const state = await this.getAccountState({
  //     blockchainId: this.blockchainId,
  //     account,
  //   })
  //   if (!state) return

  //   const { firstSlot = Number.MAX_SAFE_INTEGER, lastSlot = 0 } = state

  //   const inRange = startSlot > firstSlot && endSlot <= lastSlot
  //   if (!inRange) return

  //   const signaturesQuery = await this.accountSignatureDAL
  //     .useIndex(SolanaAccountTransactionHistoryDALIndex.AccountSlotIndex)
  //     .getAllFromTo([account, startSlot], [account, endSlot], {
  //       reverse: false,
  //     })

  //   return compose(
  //     signaturesQuery,
  //     new StreamMap(
  //       ({ value }: StorageEntry<string, SolanaSignatureInfo>) =>
  //         value.signature,
  //     ),
  //     new StreamBuffer(1000),
  //     new StreamMap(async (signatures: string[]) => {
  //       // @note: Use the client here for load balancing signatures through all fetcher instances
  //       await this.fetcherClient
  //         .useBlockchain(this.blockchainId)
  //         .fetchTransactionsBySignature({
  //           signatures,
  //           indexerId,
  //         })
  //       return signatures
  //     }),
  //   )
  // }

  /**
   * Returns the state of the transaction fetch process of a given account.
   * @param args The account address to get its fetch status.
   */
  async getAccountState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<SolanaAccountEntityHistoryState | undefined> {
    const state: SolanaAccountEntityHistoryState | undefined =
      await this.getPartialAccountState(args)

    if (!state) return

    const forward = state.cursors?.forward
    if (forward) {
      state.lastTimestamp = forward.timestamp
      state.lastSlot = forward.slot
    }

    const backward = state.cursors?.backward
    if (backward) {
      // @note: Pagination in solana is by tx signature, so going backward we can't guarantee that each page contain complete date or slots ranges
      const offset = state.completeHistory ? 0 : 1

      state.firstTimestamp = backward.timestamp
        ? backward.timestamp + offset
        : undefined
      state.firstSlot = backward.slot ? backward.slot + offset : undefined
    }

    return state
  }

  protected getAccountFetcher(
    account: string,
  ): SolanaAccountTransactionHistoryFetcher {
    return new SolanaAccountTransactionHistoryFetcher(
      account,
      this.blockchainId,
      this.accountEntityHistoryDAL,
      this.solanaRpc,
      this.solanaMainPublicRpc,
      this.fetcherStateDAL,
    )
  }
}
