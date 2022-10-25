import { AccountInfo, PublicKey } from '@solana/web3.js'
import { AccountInfoStorage } from '../../storage/accountInfo.js'
import { AccountInfoFetcherOptions, Utils } from '../../index.js'
import { SolanaRPC } from '../../solana.js'

/**
 * Fetcher account info class: Component of the fetcher that is in charge of managing the
 * process of obtaining information from the account.
 */
export class AccountInfoFetcher {
  protected debouncedJob: Utils.DebouncedJob<AccountInfo<Buffer>>
  protected subscriptionId: number | undefined

  /**
   * Initialize the AccountInfoFetcher.
   * @param opts Options where the account address is stored and if it needs to be updated.
   * @param dal The account info storage.
   * @param solanaRpc The solana RPC client to use.
   * @param solanaMainPublicRpc The solana mainnet public RPC client to use.
   * @param id Identifier containing the account address.
   */
  constructor(
    protected opts: AccountInfoFetcherOptions,
    protected dal: AccountInfoStorage,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    protected id = `accountInfo:${opts.address}`,
  ) {
    this.debouncedJob = new Utils.DebouncedJob<AccountInfo<Buffer>>(
      async (accountInfo) => {
        const data = await this.parseAccountData(accountInfo)
        const accountData = data.toJSON() as any

        const account = {
          address: opts.address,
          executable: accountInfo.executable,
          owner: accountInfo.owner.toString(),
          lamports: accountInfo.lamports,
          data: accountData,
          rentEpoch: accountInfo.rentEpoch,
        }

        await this.dal.save(account)
      },
    )
  }

  protected async parseAccountData<T>(accountInfo: AccountInfo<T>): Promise<T> {
    return accountInfo.data
  }

  async init(): Promise<void> {
    // @todo: configurable by arg scheduled backups
    // await this.dal.backup()
  }

  async run(): Promise<void> {
    const conn = this.solanaRpc.getConnection()
    const address = new PublicKey(this.opts.address)
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

  async stop(): Promise<void> {
    const conn = this.solanaRpc.getConnection()

    if (this.subscriptionId) {
      await conn.removeAccountChangeListener(this.subscriptionId)
      this.subscriptionId = undefined
    }
  }
}
