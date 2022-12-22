import {
  EthereumAccountStateStorage,
  EthereumClient,
  EthereumAccountStateFetcher as EthereumStateFetcher,
  Blockchain,
} from '@aleph-indexer/core'
import { PendingAccountStorage } from '../base/dal/account.js'

import { BaseStateFetcherI, BaseStateFetcher } from '../base/stateFetcher.js'

/**
 * The main class of the fetcher service.
 */
export class EthereumAccountStateFetcher extends BaseStateFetcher {
  /**
   * Initialize the fetcher service.
   * @param accountStateDAL The account info storage.
   * @param ethereumClient The solana RPC client to use.
   */
  constructor(
    protected ethereumClient: EthereumClient,
    protected accountStateDAL: EthereumAccountStateStorage,
    ...args: [PendingAccountStorage]
  ) {
    super(Blockchain.Ethereum, ...args)
  }

  protected getAccountFetcher(account: string): BaseStateFetcherI {
    const opts = {
      account,
      subscribeChanges: true,
    }

    return new EthereumStateFetcher(
      opts,
      this.accountStateDAL,
      this.ethereumClient,
    )
  }
}
