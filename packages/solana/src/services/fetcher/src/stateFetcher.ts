import {
  BaseStateFetcher,
  BaseStateFetcherI,
  BlockchainId,
  PendingAccountStorage,
} from '@aleph-indexer/framework'
import { SolanaRPC } from '../../../sdk/client.js'
import { SolanaAccountStateFetcher } from './accountStateFetcher.js'
import {
  SolanaAccountStateFetcherOptions,
  SolanaAccountStateStorage,
} from './types.js'

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
    protected blockchainId: BlockchainId,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    protected accountStateDAL: SolanaAccountStateStorage,
    ...args: [PendingAccountStorage]
  ) {
    super(blockchainId, ...args)
  }

  protected getAccountFetcher(
    account: string,
    params: SolanaAccountStateFetcherOptions = {},
  ): BaseStateFetcherI {
    return new SolanaAccountStateFetcher(
      account,
      params,
      this.blockchainId,
      this.accountStateDAL,
      this.solanaRpc,
      this.solanaMainPublicRpc,
    )
  }
}
