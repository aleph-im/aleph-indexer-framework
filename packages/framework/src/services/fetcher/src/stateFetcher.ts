import { PendingWorkPool, PendingWork, Utils } from '@aleph-indexer/core'
import {
  AddAccountEntityRequestArgs,
  DelAccountEntityRequestArgs,
} from './types.js'
import { PendingAccountStorage } from './dal/account.js'
import { Blockchain } from '../../../types.js'

const { MAX_TIMER_INTEGER } = Utils

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
      id: `${blockchainId}:state-accounts`,
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

  async addAccount(args: AddAccountEntityRequestArgs): Promise<void> {
    const { account, indexerId } = args

    const work = {
      id: account,
      time: Date.now(),
      payload: indexerId ? [indexerId] : [],
    }

    await this.pendingAccounts.addWork(work)
  }

  async delAccount(args: DelAccountEntityRequestArgs): Promise<void> {
    const { account, indexerId } = args

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
  protected async startAccountStateFetcher(account: string): Promise<void> {
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
  protected async stopAccountStateFetcher(account: string): Promise<void> {
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
    console.log(
      `ethereum Accounts State | Start handling ${works.length} accounts`,
    )

    const accounts = works.map((work) => work.id)

    for (const account of accounts) {
      await this.startAccountStateFetcher(account)
    }
  }

  protected abstract getAccountFetcher(account: string): BaseStateFetcherI
}
