import {
  BaseStateFetcher,
  BaseStateFetcherI,
  BlockchainId,
  PendingAccountStorage,
} from '@aleph-indexer/framework'
import { EthereumClient } from '../../../../sdk/client.js'
import { EthereumAccountStateFetcher } from './accountStateFetcher.js'
import { EthereumAccountStateStorage } from '../types.js'

/**
 * The main class of the fetcher service.
 */
export class EthereumStateFetcher extends BaseStateFetcher {
  /**
   * Initialize the fetcher service.
   * @param accountStateDAL The account info storage.
   * @param ethereumClient The solana RPC client to use.
   */
  constructor(
    protected blockchainId: BlockchainId,
    protected ethereumClient: EthereumClient,
    protected accountStateDAL: EthereumAccountStateStorage,
    ...args: [PendingAccountStorage]
  ) {
    super(blockchainId, ...args)
  }

  protected getAccountFetcher(account: string): BaseStateFetcherI {
    const opts = {
      account,
      subscribeChanges: true,
    }

    return new EthereumAccountStateFetcher(
      this.blockchainId,
      opts,
      this.accountStateDAL,
      this.ethereumClient,
      this.blockchainId,
    )
  }
}
