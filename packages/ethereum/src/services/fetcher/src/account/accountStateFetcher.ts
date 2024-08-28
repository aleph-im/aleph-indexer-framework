import { BlockchainId } from '@aleph-indexer/framework'
import { EthereumClient } from '../../../../sdk/client.js'
import {
  EthereumAccountStateFetcherOptions,
  EthereumAccountStateStorage,
} from '../types.js'

/**
 * Fetcher account info class: Component of the fetcher that is in charge of managing the
 * process of obtaining information from the account.
 */
export class EthereumAccountStateFetcher {
  /**
   * Initialize the AccountInfoFetcher and saves the account info in the data access layer.
   * @param params Options where the account address is stored and if it needs to be updated.
   * @param dal The account info storage.
   * @param ethereumClient The ethereum RPC client to use.
   * @param id Identifier containing the account address.
   */
  constructor(
    protected account: string,
    protected params: EthereumAccountStateFetcherOptions,
    protected blockchainId: BlockchainId,
    protected dal: EthereumAccountStateStorage,
    protected ethereumClient: EthereumClient,
    protected id = `${blockchainId}:account-state:${account}`,
  ) {
    // @note: Copy to dont override referenced object
    this.params = { ...params }

    if (this.params.subscribeChanges === undefined) {
      this.params.subscribeChanges = true
    }
  }

  async init(): Promise<void> {
    // @note: no-op
  }

  async stop(): Promise<void> {
    // @note: no-op
  }

  async run(): Promise<void> {
    const balance = await this.ethereumClient
      .getSDK()
      .eth.getBalance(this.account)

    const state = {
      account: this.account,
      balance,
    }

    await this.dal.save(state)
  }
}
