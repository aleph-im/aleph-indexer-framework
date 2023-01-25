import { EthereumClient } from '../../../../rpc/ethereum/client.js'
import { Blockchain } from '../../../../types/common.js'
import { PendingAccountStorage } from '../base/dal/account.js'

import { BaseStateFetcherI, BaseStateFetcher } from '../base/stateFetcher.js'
import {
  AddAccountStateRequestArgs,
  DelAccountTransactionRequestArgs,
} from '../base/types.js'
import { EthereumAccountStateFetcher } from './accountStateFetcher.js'
import { EthereumAccountStateStorage } from './types.js'

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
    protected ethereumClient: EthereumClient,
    protected accountStateDAL: EthereumAccountStateStorage,
    ...args: [PendingAccountStorage]
  ) {
    super(Blockchain.Ethereum, ...args)
  }

  async addAccount(args: AddAccountStateRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.addAccount(args)
  }

  async delAccount(args: DelAccountTransactionRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.delAccount(args)
  }

  protected getAccountFetcher(account: string): BaseStateFetcherI {
    const opts = {
      account,
      subscribeChanges: true,
    }

    return new EthereumAccountStateFetcher(
      opts,
      this.accountStateDAL,
      this.ethereumClient,
    )
  }
}
