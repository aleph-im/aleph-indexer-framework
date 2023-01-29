import { Blockchain } from '@aleph-indexer/framework'
import { EthereumClient } from '../../../sdk/client.js'
import {
  EthereumAccountStateFetcherOptions,
  EthereumAccountStateStorage,
} from './types.js'

/**
 * Fetcher account info class: Component of the fetcher that is in charge of managing the
 * process of obtaining information from the account.
 */
export class EthereumAccountStateFetcher {
  /**
   * Initialize the AccountInfoFetcher and saves the account info in the data access layer.
   * @param opts Options where the account address is stored and if it needs to be updated.
   * @param dal The account info storage.
   * @param ethereumClient The ethereum RPC client to use.
   * @param id Identifier containing the account address.
   */
  constructor(
    protected opts: EthereumAccountStateFetcherOptions,
    protected dal: EthereumAccountStateStorage,
    protected ethereumClient: EthereumClient,
    protected id = `${Blockchain.Ethereum}:account-state:${opts.account}`,
  ) {}

  async init(): Promise<void> {
    // @note: no-op
  }

  async stop(): Promise<void> {
    // @note: no-op
  }

  async run(): Promise<void> {
    const balance = await this.ethereumClient
      .getSDK()
      .eth.getBalance(this.opts.account)

    const state = {
      account: this.opts.account,
      balance,
    }

    await this.dal.save(state)
  }
}
