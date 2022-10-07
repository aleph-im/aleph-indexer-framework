import { StorageStream } from '@aleph-indexer/core'
import {
  IndexerMainDomain,
  IndexerMainDomainWithDiscovery,
  IndexerMainDomainWithStats,
  AccountIndexerConfigWithMeta,
  IndexerMainDomainContext,
  AccountStats,
} from '@aleph-indexer/framework'
import { AccountType, ParsedEvents } from '../utils/layouts/index.js'
import {
  GlobalMarinadeFinanceStats,
  MarinadeFinanceAccountStats,
  MarinadeFinanceAccountData,
  MarinadeFinanceAccountInfo, TimeStats,
} from '../types.js'
import MarinadeFinanceDiscoverer from './discoverer/marinade_finance.js'

export default class MainDomain
  extends IndexerMainDomain
  implements IndexerMainDomainWithDiscovery, IndexerMainDomainWithStats
{
  protected stats!: GlobalMarinadeFinanceStats

  constructor(
    protected context: IndexerMainDomainContext,
    protected discoverer: MarinadeFinanceDiscoverer = new MarinadeFinanceDiscoverer(),
  ) {
    super(context, {
      discoveryInterval: 1000 * 60 * 60 * 1,
      stats: 1000 * 60 * 5,
    })
  }

  async discoverAccounts(): Promise<
    AccountIndexerConfigWithMeta<MarinadeFinanceAccountInfo>[]
  > {
    const accounts = await this.discoverer.loadAccounts()

    return accounts.map((meta) => {
      return {
        account: meta.address,
        meta,
        index: {
          transactions: {
            chunkDelay: 0,
            chunkTimeframe: 1000 * 60 * 60 * 24,
          },
          content: false,
        },
      }
    })
  }

  async getAccounts(
    includeStats?: boolean,
  ): Promise<Record<string, MarinadeFinanceAccountData>> {
    const accounts: Record<string, MarinadeFinanceAccountData> = {}

    await Promise.all(
      Array.from(this.accounts || []).map(async (account) => {
        const actual = await this.getAccount(account, includeStats)
        accounts[account] = actual as MarinadeFinanceAccountData
      }),
    )

    return accounts
  }

  async getAccount(
    account: string,
    includeStats?: boolean,
  ): Promise<MarinadeFinanceAccountData> {
    const info = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getAccountInfo',
    })) as MarinadeFinanceAccountInfo

    if (!includeStats) return { info }

    const { stats } = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getMarinadeFinanceStats',
    })) as AccountStats<MarinadeFinanceAccountStats>

    return { info, stats }
  }

  async getAccountEventsByTime(
    account: string,
    startDate: number,
    endDate: number,
    opts: any,
  ): Promise<StorageStream<string, ParsedEvents>> {
    const stream = await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getAccountEventsByTime',
      args: [startDate, endDate, opts],
    })

    console.log('getAccountEventsByTime stream', typeof stream)
    return stream as StorageStream<string, ParsedEvents>
  }

  async updateStats(now: number): Promise<void> {
    this.stats = await this.computeGlobalStats()
  }

  async getGlobalStats(
    addresses?: string[],
  ): Promise<GlobalMarinadeFinanceStats> {
    if (!addresses || addresses.length === 0) {
      if (!this.stats) {
        await this.updateStats(Date.now())
      }

      return this.stats
    }

    return this.computeGlobalStats(addresses)
  }

  async computeGlobalStats(
    accountAddresses?: string[],
  ): Promise<GlobalMarinadeFinanceStats> {
    const accountsStats = await this.getAccountStats<TimeStats>(accountAddresses)
    const globalStats: GlobalMarinadeFinanceStats = this.getNewGlobalStats()

    for (const accountStats of accountsStats) {
      if (!accountStats.stats) continue

      const { accesses, accessesByProgramId, startTimestamp, endTimestamp } =
        accountStats.stats

      const type = this.discoverer.getAccountType(accountStats.account)

      globalStats.totalAccounts[type]++
      globalStats.totalAccesses += accesses || 0
      if(accessesByProgramId) {
        Object.entries(accessesByProgramId).forEach(([programId, accesses]) => {
          globalStats.totalAccessesByProgramId[programId] =
            (globalStats.totalAccessesByProgramId[programId] || 0) + accesses
        })
      }
      globalStats.startTimestamp = Math.min(
        globalStats.startTimestamp || Number.MAX_SAFE_INTEGER, startTimestamp || Number.MAX_SAFE_INTEGER,
      )
      globalStats.endTimestamp = Math.max(
        globalStats.endTimestamp || 0, endTimestamp || 0,
      )
    }
    return globalStats
  }

  getNewGlobalStats(): GlobalMarinadeFinanceStats {
    return {
      totalAccesses: 0,
      totalAccounts: {
        [AccountType.State]: 0,
        [AccountType.TicketAccountData]: 0,
      },
      totalAccessesByProgramId: {},
      startTimestamp: undefined,
      endTimestamp: undefined,
    }
  }
}
