import { AccountInfo, PublicKey } from '@solana/web3.js'
import { Utils } from '@aleph-indexer/core'
import {
  SolanaAccountStateFetcherOptions,
  SolanaAccountStateStorage,
} from './types.js'
import { SolanaRPC } from '../../../sdk/client.js'
import { BlockchainId } from '@aleph-indexer/framework'

// @todo: REFACTOR

/**
 * Fetcher account info class: Component of the fetcher that is in charge of managing the
 * process of obtaining information from the account.
 */
export class SolanaAccountStateFetcher {
  protected debouncedJob: Utils.DebouncedJob<AccountInfo<Buffer>>
  protected subscriptionId: number | undefined

  /**
   * Initialize the AccountInfoFetcher and saves the account info in the data access layer.
   * @param params Options where the account address is stored and if it needs to be updated.
   * @param accountStateDAL The account info storage.
   * @param solanaRpc The solana RPC client to use.
   * @param solanaMainPublicRpc The solana mainnet public RPC client to use.
   * @param id Identifier containing the account address.
   */
  constructor(
    protected account: string,
    protected params: SolanaAccountStateFetcherOptions,
    protected blockchainId: BlockchainId,
    protected accountStateDAL: SolanaAccountStateStorage,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    protected id = `${blockchainId}:account-state:${account}`,
  ) {
    this.debouncedJob = new Utils.DebouncedJob<AccountInfo<Buffer>>(
      async (accountInfo) => {
        const data = await this.parseAccountData(accountInfo)
        const accountData = data.toJSON() as any

        const state = {
          account: this.account,
          executable: accountInfo.executable,
          owner: accountInfo.owner.toString(),
          lamports: accountInfo.lamports,
          data: accountData,
          rentEpoch: accountInfo.rentEpoch,
        }

        await this.accountStateDAL.save(state)
      },
    )

    // @note: Copy to dont override referenced object
    this.params = { ...params }

    if (this.params.subscribeChanges === undefined) {
      this.params.subscribeChanges = true
    }
  }

  async init(): Promise<void> {
    // @todo: configurable by arg scheduled backups
  }

  async stop(): Promise<void> {
    const conn = this.solanaRpc.getConnection()

    if (this.subscriptionId) {
      await conn.removeAccountChangeListener(this.subscriptionId)
      this.subscriptionId = undefined
    }
  }

  /**
   * Gets the accountInfo, and if the subscribeChanges flag is true,
   * registers a callback to be invoked whenever the specified account changes.
   */
  async run(): Promise<void> {
    const conn = this.solanaRpc.getConnection()
    const address = new PublicKey(this.account)
    // Fetch them for the first time
    const accountInfo = await conn.getAccountInfo(address)
    if (accountInfo) this.debouncedJob.run(accountInfo)

    if (this.params.subscribeChanges) {
      this.subscriptionId = conn.onAccountChange(
        address,
        async (accountInfo) => {
          await this.debouncedJob.run(accountInfo)
        },
      )
    }
  }

  /**
   * Returns account data from the accountInfo argument.
   */
  protected async parseAccountData<T>(accountInfo: AccountInfo<T>): Promise<T> {
    return accountInfo.data
  }
}
