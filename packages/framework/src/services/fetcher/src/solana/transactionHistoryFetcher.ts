import { pipeline } from 'node:stream'
import {
  FetcherStateLevelStorage,
  SolanaSignatureInfo,
  SolanaRPC,
  SolanaAccountSignatureHistoryPaginationCursor,
  StorageEntry,
  Utils,
  Blockchain,
  SolanaSignature,
} from '@aleph-indexer/core'

import {
  SolanaAccountSignatureDALIndex,
  SolanaAccountSignatureStorage,
} from './dal/accountSignature.js'
import { BaseTransactionHistoryFetcher } from '../base/transactionHistoryFetcher.js'
import { GetAccountTransactionStateRequestArgs } from '../base/types.js'
import {
  FetchAccountTransactionsBySlotRequestArgs,
  SolanaAccountTransactionHistoryState,
} from './types.js'
import { SolanaAccountSignatureHistoryFetcher } from './accountSignatureHistoryFetcher.js'
import { PendingAccountStorage } from '../base/dal/account.js'
import { FetcherMsClient } from '../../client.js'

const { StreamBuffer, StreamMap } = Utils

export class SolanaTransactionHistoryFetcher extends BaseTransactionHistoryFetcher<
  SolanaAccountSignatureHistoryPaginationCursor,
  SolanaSignature
> {
  /**
   * Initialize the fetcher service.
   * @param solanaRpc The solana RPC client to use.
   * @param solanaMainPublicRpc The solana mainnet public RPC client to use.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    ...args: [
      FetcherMsClient,
      SolanaAccountSignatureStorage,
      PendingAccountStorage,
    ]
  ) {
    super(Blockchain.Solana, ...args)
  }

  /**
   * Fetch transactions from an account by slot.
   * @param args accountAddress, startDate, endDate and indexerId.
   */
  async fetchAccountTransactionsBySlot(
    args: FetchAccountTransactionsBySlotRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    const { account, startSlot, endSlot, indexerId } = args

    const state = await this.getAccountState({
      blockchainId: this.blockchainId,
      account,
    })
    if (!state) return

    const {
      completeHistory,
      firstSlot = Number.MAX_SAFE_INTEGER,
      lastSlot = 0,
    } = state

    const inRange =
      (completeHistory || startSlot > firstSlot) && endSlot <= lastSlot

    if (!inRange) return

    const signaturesQuery = await this.accountSignatureDAL
      .useIndex(SolanaAccountSignatureDALIndex.AccountSlotIndex)
      .getAllFromTo([account, startSlot], [account, endSlot], {
        reverse: false,
      })

    return pipeline(
      signaturesQuery,
      new StreamMap(
        ({ value }: StorageEntry<string, SolanaSignatureInfo>) =>
          value.signature,
      ),
      new StreamBuffer(1000),
      new StreamMap(async (signatures: string[]) => {
        // @note: Use the client here for load balancing signatures through all fetcher instances
        await this.fetcherClient
          .useBlockchain(this.blockchainId)
          .fetchTransactionsBySignature({
            signatures,
            indexerId,
          })
        return signatures
      }),
    )
  }

  /**
   * Returns the state of the transaction fetch process of a given account.
   * @param args The account address to get its fetch status.
   */
  async getAccountState(
    args: GetAccountTransactionStateRequestArgs,
  ): Promise<SolanaAccountTransactionHistoryState | undefined> {
    const state: SolanaAccountTransactionHistoryState | undefined =
      await this.getPartialAccountState(args)

    if (!state) return

    const forward = state.cursors?.forward
    if (forward) {
      state.lastTimestamp = forward.timestamp
      state.lastSlot = forward.slot
    }

    const backward = state.cursors?.backward
    if (backward) {
      state.firstTimestamp = backward.timestamp
      state.firstSlot = backward.slot
    }

    return state
  }

  protected getAccountFetcher(
    account: string,
  ): SolanaAccountSignatureHistoryFetcher {
    return new SolanaAccountSignatureHistoryFetcher(
      account,
      this.accountSignatureDAL,
      this.solanaRpc,
      this.solanaMainPublicRpc,
      this.fetcherStateDAL,
    )
  }
}
