import { Utils } from '@aleph-indexer/core'
import { EntityRequest } from '../../../services/indexer/src/dal/entityRequest.js'
import {
  AccountIndexerConfigWithMeta,
  AccountIndexerRequestArgs,
  AccountIndexerState,
  GetEntityPendingRequestsRequestArgs,
  IndexerMainDomainContext,
} from '../../../services/indexer/src/types.js'
import {
  BlockchainId,
  IndexableEntityType,
  getBlockchainConfig,
} from '../../../types.js'
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
    blockchainId: BlockchainId,
    accounts: string[],
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats[]>
  /**
   * Returns the global stats for the given accounts.
   * @param accounts The accounts to get the summary from.
   */
  getAccountStats(
    blockchainId: BlockchainId,
    accounts: string[],
  ): Promise<AccountStats[]>
}

/**
 * Describes the main indexer domain class capable of account discovery.
 */
export type IndexerMainDomainWithDiscovery<M = unknown> = {
  discoverAccounts(): Promise<
    (AccountIndexerConfigWithMeta<M> | AccountIndexerRequestArgs)[]
  >
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
export abstract class IndexerMainDomain {
  protected discoverJob: Utils.JobRunner | undefined
  protected statsJob: Utils.JobRunner | undefined
  protected accounts: Record<BlockchainId, Set<string>>

  constructor(
    protected context: IndexerMainDomainContext,
    protected baseConfig?: IndexerMainDomainConfig,
  ) {
    this.accounts = this.context.supportedBlockchains.reduce((acc, curr) => {
      const { id } = getBlockchainConfig(curr)

      acc[id] = new Set<string>()
      return acc
    }, {} as Record<BlockchainId, Set<string>>)

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
    blockchainId: BlockchainId,
    type: IndexableEntityType,
    accounts: string[] = [],
  ): Promise<AccountIndexerState[]> {
    return (
      await Promise.all(
        this.getBlockchainAccounts(blockchainId, accounts).map((account) =>
          this.context.apiClient
            .useBlockchain(blockchainId)
            .getAccountState({ type, account }),
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
    blockchainId: BlockchainId,
    accounts: string[] = [],
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats<V>[]> {
    this.checkStats()

    return Promise.all(
      this.getBlockchainAccounts(blockchainId, accounts).map(
        async (account) => {
          const stats = (await this.context.apiClient
            .useBlockchain(blockchainId)
            .invokeDomainMethod({
              account,
              method: 'getTimeSeriesStats',
              args: [type, filters],
            })) as AccountTimeSeriesStats<V>

          return stats
        },
      ),
    )
  }

  /**
   * Returns the global stats for the given accounts.
   * @param accounts The accounts to get the summary from.
   */
  async getAccountStats<V>(
    blockchainId: BlockchainId,
    accounts: string[] = [],
  ): Promise<AccountStats<V>[]> {
    this.checkStats()

    return await Promise.all(
      this.getBlockchainAccounts(blockchainId, accounts).map(
        async (account) => {
          const stats = (await this.context.apiClient
            .useBlockchain(blockchainId)
            .invokeDomainMethod({
              account,
              method: 'getStats',
              args: [],
            })) as AccountStats<V>

          return stats
        },
      ),
    )
  }

  protected getBlockchainAccounts(
    blockchainId: BlockchainId,
    accounts: string[] = [],
  ): string[] {
    const accountsSet = this.accounts[blockchainId]

    const client = this.context.apiClient.useBlockchain(blockchainId)
    accounts = accounts.map((account) => client.normalizeAccount(account))

    return accounts.length === 0
      ? Array.from(accountsSet.values())
      : accounts.filter((account) => accountsSet.has(account))
  }

  protected async _discover(): Promise<void> {
    if (!this.checkDiscovery()) return

    const options = await this.discoverAccounts()

    const newOptions = options.filter(({ blockchainId, account }) => {
      const blockchainAccounts = this.accounts[blockchainId]
      if (!blockchainAccounts)
        throw new Error(
          `Accounts that belongs to "${blockchainId}" blockchain are NOT supported by the indexer. Add "${blockchainId}" to "supportedBlockchains" list in the indexer configuration, or remove the account from the discovery process`,
        )

      const client = this.context.apiClient.useBlockchain(blockchainId)
      const acc = client.normalizeAccount(account)

      return !blockchainAccounts.has(acc)
    })

    await this.indexAccounts(newOptions)
  }

  /**
   * Called when a new account is discovered.
   * @param options The indexer options to use for the new account.
   * @protected
   */
  protected async indexAccounts(
    options: (
      | AccountIndexerConfigWithMeta<unknown>
      | AccountIndexerRequestArgs
    )[],
  ): Promise<void> {
    await Promise.all(
      options.map(async (option) => {
        const client = this.context.apiClient.useBlockchain(option.blockchainId)

        await client.indexAccount(option)

        const account = client.normalizeAccount(option.account)
        this.accounts[option.blockchainId].add(account)
      }),
    )
  }

  protected async _updateStats(): Promise<void> {
    if (!this.checkStats()) return

    const now = Date.now()
    const blockchains = Object.keys(this.accounts) as BlockchainId[]

    await Promise.all(
      blockchains.map(async (blockchainId) => {
        const accounts = Array.from(this.accounts[blockchainId].values())

        await Promise.all(
          accounts.map(async (account) => {
            await this.context.apiClient
              .useBlockchain(blockchainId)
              .invokeDomainMethod({
                account,
                method: 'updateStats',
                args: [now],
              })
          }),
        )
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

  async getEntityPendingRequests(
    args: GetEntityPendingRequestsRequestArgs,
  ): Promise<EntityRequest[]> {
    const indexer = (args.indexer as unknown as string[]) || []

    const indexers = indexer.length
      ? indexer
      : this.context.apiClient.getAllIndexers()

    return (
      await Promise.all(
        indexers.map((indexer) =>
          this.context.apiClient
            .useBlockchain(args.blockchainId)
            .getEntityPendingRequests({ ...args, indexer }),
        ),
      )
    ).flatMap((requests) => requests)
  }
}
