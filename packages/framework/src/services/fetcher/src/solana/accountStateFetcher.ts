import {
  SolanaAccountStateStorage,
  SolanaRPC,
  SolanaAccountStateFetcher as SolanaStateFetcher,
  Blockchain,
} from '@aleph-indexer/core'
import { PendingAccountStorage } from '../base/dal/account.js'

import { BaseStateFetcherI, BaseStateFetcher } from '../base/stateFetcher.js'

/**
 * The main class of the fetcher service.
 */
export class SolanaAccountStateFetcher extends BaseStateFetcher {
  /**
   * Initialize the fetcher service.
   * @param accountStateDAL The account info storage.
   * @param solanaRpc The solana RPC client to use.
   * @param solanaMainPublicRpc The solana mainnet public RPC client to use.
   */
  constructor(
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    protected accountStateDAL: SolanaAccountStateStorage,
    ...args: [PendingAccountStorage]
  ) {
    super(Blockchain.Solana, ...args)
  }

  protected getAccountFetcher(account: string): BaseStateFetcherI {
    account = account.toLowerCase()

    const opts = {
      account,
      subscribeChanges: true,
    }

    return new SolanaStateFetcher(
      opts,
      this.accountStateDAL,
      this.solanaRpc,
      this.solanaMainPublicRpc,
    )
  }
}
