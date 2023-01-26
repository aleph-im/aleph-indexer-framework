import { AccountInfo, PublicKey } from '@solana/web3.js'
import { Utils } from '@aleph-indexer/core'
import {
  SolanaAccountStateFetcherOptions,
  SolanaAccountStateStorage,
} from './types.js'
import { SolanaRPC } from '../../../sdk/client.js'

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
   * @param opts Options where the account address is stored and if it needs to be updated.
   * @param accountStateDAL The account info storage.
   * @param solanaRpc The solana RPC client to use.
   * @param solanaMainPublicRpc The solana mainnet public RPC client to use.
   * @param id Identifier containing the account address.
   */
  constructor(
    protected opts: SolanaAccountStateFetcherOptions,
    protected accountStateDAL: SolanaAccountStateStorage,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    protected id = `solana:account-state:${opts.account}`,
  ) {
    this.debouncedJob = new Utils.DebouncedJob<AccountInfo<Buffer>>(
      async (accountInfo) => {
        const data = await this.parseAccountData(accountInfo)
        const accountData = data.toJSON() as any

        const state = {
          account: opts.account,
          executable: accountInfo.executable,
          owner: accountInfo.owner.toString(),
          lamports: accountInfo.lamports,
          data: accountData,
          rentEpoch: accountInfo.rentEpoch,
        }

        await this.accountStateDAL.save(state)
      },
    )
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
    const address = new PublicKey(this.opts.account)
    // Fetch them for the first time
    const accountInfo = await conn.getAccountInfo(address)
    if (accountInfo) this.debouncedJob.run(accountInfo)

    if (this.opts.subscribeChanges) {
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
