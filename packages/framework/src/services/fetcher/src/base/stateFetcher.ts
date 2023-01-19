import { PendingWorkPool, PendingWork, Blockchain } from '@aleph-indexer/core'
import {
  AddAccountStateRequestArgs,
  DelAccountTransactionRequestArgs,
} from './types.js'
import { PendingAccountStorage } from './dal/account.js'
import { MAX_TIMER_INTEGER } from '@aleph-indexer/core/dist/constants.js'

export interface BaseStateFetcherI {
  init(): Promise<void>
  stop(): Promise<void>
  run(): Promise<void>
}

/**
 * The main class of the fetcher service.
 */
export abstract class BaseStateFetcher {
  protected pendingAccounts: PendingWorkPool<string[]>
  protected fetchers: Record<string, BaseStateFetcherI> = {}

  /**
   * Initialize the fetcher service.
   * @param accountDAL The account job storage.
   */
  constructor(
    protected blockchainId: Blockchain,
    protected accountDAL: PendingAccountStorage,
  ) {
    this.pendingAccounts = new PendingWorkPool({
      id: 'state-accounts',
      interval: MAX_TIMER_INTEGER, // @note: Run once
      chunkSize: 100,
      concurrency: 1,
      dal: this.accountDAL,
      handleWork: this._handleAccounts.bind(this),
      checkComplete: () => false,
    })
  }

  async start(): Promise<void> {
    await this.pendingAccounts.start()
  }

  async stop(): Promise<void> {
    await this.pendingAccounts.stop()

    for (const account of Object.keys(this.fetchers)) {
      await this.stopAccountStateFetcher(account)
    }
  }

  async addAccount(args: AddAccountStateRequestArgs): Promise<void> {
    const { indexerId } = args
    const account = args.account.toLowerCase()

    const work = {
      id: account,
      time: Date.now(),
      payload: indexerId ? [indexerId] : [],
    }

    await this.pendingAccounts.addWork(work)
  }

  async delAccount(args: DelAccountTransactionRequestArgs): Promise<void> {
    const { indexerId } = args
    const account = args.account.toLowerCase()

    if (!indexerId) return

    const work = await this.accountDAL.getFirstValueFromTo([account], [account])
    if (!work) return

    work.payload = work.payload.filter((id: string) => id !== indexerId)

    if (work.payload.length > 0) {
      await this.pendingAccounts.addWork(work)
    } else {
      await this.pendingAccounts.removeWork(work)
    }
  }

  /**
   * Creates an account info fetcher.
   * Allows to obtain the current state of the account
   * @param account Consists of the account address
   */
  async startAccountStateFetcher(account: string): Promise<void> {
    account = account.toLowerCase()

    let fetcher = this.fetchers[account]
    if (fetcher) return

    fetcher = this.getAccountFetcher(account)

    this.fetchers[account] = fetcher

    await fetcher.init()
    await fetcher.run()
  }

  /**
   * Removes an account info fetcher from the map and its existing requests.
   * @param account The account address to remove from the map.
   */
  async stopAccountStateFetcher(account: string): Promise<void> {
    account = account.toLowerCase()

    const fetcher = this.fetchers[account]
    if (!fetcher) return

    await fetcher.stop()

    delete this.fetchers[account]
  }

  /**
   * Fetch signatures from accounts.
   * @param works Txn signatures with extra properties as time and payload.
   */
  protected async _handleAccounts(
    works: PendingWork<string[]>[],
  ): Promise<void> {
    console.log(`Accounts State | Start handling ${works.length} accounts`)

    const accounts = works.map((work) => work.id)

    for (const account of accounts) {
      await this.startAccountStateFetcher(account)
    }
  }

  protected abstract getAccountFetcher(account: string): BaseStateFetcherI
}
