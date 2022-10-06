import { Utils } from '@aleph-indexer/core'
import { TransactionRequest } from '../../../services/indexer/src/dal/transactionRequest.js'
import {
  AccountIndexerRequestArgs,
  AccountIndexerState,
  GetTransactionPendingRequestsRequestArgs,
  IndexerMainDomainContext,
} from '../../../services/indexer/src/types.js'
import {
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats,
} from '../../stats/types.js'

/**
 * Describes the main indexer domain class capable of calculating stats.
 */
export type IndexerMainDomainWithStats = {
  /**
   * Updates all stats.
   * @param now
   */
  updateStats(now: number): Promise<void>
  /**
   * Returns the time-series stats for the given account.
   * @param accounts The accounts to get the time-series stats from.
   * @param type The type of time-series to get.
   * @param filters The transformations and clipping to apply to the time-series.
   */
  getAccountTimeSeriesStats(
    accounts: string[],
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats[]>
  /**
   * Returns the global stats for the given accounts.
   * @param accounts The accounts to get the summary from.
   */
  getAccountStats(accounts: string[]): Promise<AccountStats[]>
}

/**
 * Describes the main indexer domain class capable of account discovery.
 */
export type IndexerMainDomainWithDiscovery = {
  discoverAccounts(): Promise<AccountIndexerRequestArgs[]>
}

export type IndexerMainDomainConfig = {
  /**
   * The interval in milliseconds to discover new accounts.
   */
  discoveryInterval?: number
  /**
   * The interval in milliseconds to recalculate the stats.
   */
  stats?: number
}

/**
 * The main indexer domain class.
 * Primary entry point for all data being indexed.
 * This is a core piece in developing a custom indexer. Add and overwrite
 * methods to customize the indexer. This class communicates through the broker
 * with the services, which can be powered by multiple workers. All of this is
 * abstracted away through this class.
 */
export class IndexerMainDomain {
  protected discoverJob: Utils.JobRunner | undefined
  protected statsJob: Utils.JobRunner | undefined
  protected accounts: Set<string> = new Set()

  constructor(
    protected context: IndexerMainDomainContext,
    protected baseConfig?: IndexerMainDomainConfig,
  ) {
    if (typeof baseConfig?.discoveryInterval === 'number') {
      this.discoverJob = new Utils.JobRunner({
        name: `main-account-discovery`,
        interval: baseConfig?.discoveryInterval,
        intervalFn: this._discover.bind(this),
      })
    }

    if (typeof baseConfig?.stats === 'number') {
      this.statsJob = new Utils.JobRunner({
        name: `main-account-stats`,
        interval: baseConfig?.stats,
        intervalFn: this._updateStats.bind(this),
      })
    }
  }

  /**
   * Initializes the stats and discovery jobs.
   * @param args Not used.
   */
  async init(...args: unknown[]): Promise<void> {
    if (this.statsJob) {
      this.checkStats()

      if (this.discoverJob) {
        this.discoverJob.on('firstRun', () => {
          if (!this.statsJob) return
          this.statsJob.run().catch(() => 'ignore')
        })
      } else {
        this.statsJob.run().catch(() => 'ignore')
      }
    }

    if (this.discoverJob) {
      this.checkDiscovery()

      this.discoverJob.run().catch(() => 'ignore')
    }
  }

  /**
   * Checks whether the indexer has discovery capabilities.
   */
  withDiscovery(): this is IndexerMainDomainWithDiscovery {
    return typeof (this as any).discoverAccounts === 'function'
  }

  /**
   * Checks whether the indexer has stats capabilities.
   */
  withStats(): this is IndexerMainDomainWithStats {
    return (
      typeof (this as any).updateStats === 'function' &&
      typeof (this as any).getAccountTimeSeriesStats === 'function' &&
      typeof (this as any).getAccountStats === 'function'
    )
  }

  /**
   * Gets the indexing state of the given accounts.
   * @param accounts The accounts to get the state from.
   */
  async getAccountState(
    accounts: string[] = [],
  ): Promise<AccountIndexerState[]> {
    accounts =
      accounts.length !== 0 ? accounts : Array.from(this.accounts.values())

    return (
      await Promise.all(
        accounts.map(async (account) =>
          this.context.apiClient.getAccountState({
            account,
          }),
        ),
      )
    ).filter((info): info is AccountIndexerState => !!info)
  }

  /**
   * Returns the time-series stats for the given account.
   * @param accounts The accounts to get the time-series stats from.
   * @param type The type of time-series to get.
   * @param filters The transformations and clipping to apply to the time-series.
   */
  async getAccountTimeSeriesStats<V>(
    accounts: string[] = [],
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats<V>[]> {
    this.checkStats()

    accounts =
      accounts.length !== 0 ? accounts : Array.from(this.accounts.values())

    return Promise.all(
      accounts.map(async (account) => {
        const stats = (await this.context.apiClient.invokeDomainMethod({
          account,
          method: 'getTimeSeriesStats',
          args: [type, filters],
        })) as AccountTimeSeriesStats<V>

        return stats
      }),
    )
  }

  /**
   * Returns the global stats for the given accounts.
   * @param accounts The accounts to get the summary from.
   */
  async getAccountStats<V>(accounts: string[] = []): Promise<AccountStats<V>[]> {
    this.checkStats()

    accounts =
      accounts.length !== 0 ? accounts : Array.from(this.accounts.values())

    return Promise.all(
      accounts.map(async (account) => {
        const stats = (await this.context.apiClient.invokeDomainMethod({
          account,
          method: 'getStats',
          args: [],
        })) as AccountStats<V>

        return stats
      }),
    )
  }

  protected async _discover(): Promise<void> {
    if (!this.checkDiscovery()) return

    const options = await this.discoverAccounts()

    const newOptions = options.filter(
      ({ account }) => !this.accounts.has(account),
    )

    await this.onDiscover(newOptions)
  }

  /**
   * Called when a new account is discovered.
   * @param options The indexer options to use for the new account.
   * @protected
   */
  protected async onDiscover(
    options: AccountIndexerRequestArgs[],
  ): Promise<void> {
    await Promise.all(
      options.map(async (option) => {
        await this.context.apiClient.indexAccount(option)
        this.accounts.add(option.account)
      }),
    )
  }

  protected async _updateStats(): Promise<void> {
    if (!this.checkStats()) return

    const now = Date.now()
    const accounts = Array.from(this.accounts.values())

    await Promise.all(
      accounts.map(async (account) => {
        await this.context.apiClient.invokeDomainMethod({
          account,
          method: 'updateStats',
          args: [now],
        })
      }),
    )

    await this.updateStats(now)
  }

  /**
   * Throws an error if the indexer does not have discovery capabilities.
   * @protected
   */
  protected checkDiscovery(): this is IndexerMainDomainWithDiscovery {
    if (!this.withDiscovery()) {
      throw new Error(
        `MainDomain class should implement "WithDiscovery" interface`,
      )
    }

    return true
  }

  /**
   * Throws an error if the indexer does not have stats capabilities.
   * @protected
   */
  protected checkStats(): this is IndexerMainDomainWithStats {
    if (!this.withStats()) {
      throw new Error(`MainDomain class should implement "WithStats" interface`)
    }

    return true
  }

  // Private API

  async getTransactionRequests(
    args: GetTransactionPendingRequestsRequestArgs,
  ): Promise<TransactionRequest[]> {
    const indexer = (args.indexer as unknown as string[]) || []

    const indexers = indexer.length
      ? indexer
      : this.context.apiClient.getAllIndexers()

    return (
      await Promise.all(
        indexers.map((indexer) =>
          this.context.apiClient.getTransactionRequests({ ...args, indexer }),
        ),
      )
    ).flatMap((requests) => requests)
  }
}
