import { SolanaRPC } from '../../../../rpc/solana/client.js'
import { Blockchain } from '../../../../types/common.js'
import { PendingAccountStorage } from '../base/dal/account.js'
import { BaseStateFetcherI, BaseStateFetcher } from '../base/stateFetcher.js'
import { SolanaAccountStateFetcher } from './accountStateFetcher.js'
import { SolanaAccountStateStorage } from './types.js'

/**
 * The main class of the fetcher service.
 */
export class SolanaStateFetcher extends BaseStateFetcher {
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
    const opts = {
      account,
      subscribeChanges: true,
    }

    return new SolanaAccountStateFetcher(
      opts,
      this.accountStateDAL,
      this.solanaRpc,
      this.solanaMainPublicRpc,
    )
  }
}
