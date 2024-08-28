import {
  BaseStateFetcher,
  BaseStateFetcherI,
  BlockchainId,
  PendingAccountStorage,
} from '@aleph-indexer/framework'
import { EthereumClient } from '../../../../sdk/client.js'
import { EthereumAccountStateFetcher } from './accountStateFetcher.js'
import {
  EthereumAccountStateFetcherOptions,
  EthereumAccountStateStorage,
} from '../types.js'

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

  protected getAccountFetcher(
    account: string,
    params: EthereumAccountStateFetcherOptions = {},
  ): BaseStateFetcherI {
    return new EthereumAccountStateFetcher(
      account,
      params,
      this.blockchainId,
      this.accountStateDAL,
      this.ethereumClient,
      this.blockchainId,
    )
  }
}
