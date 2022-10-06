import { StorageStream } from '@aleph-indexer/core'
import {
  IndexerMainDomain,
  IndexerMainDomainWithDiscovery,
  IndexerMainDomainWithStats,
  AccountIndexerConfigWithMeta,
  IndexerMainDomainContext,
  AccountStats,
} from '@aleph-indexer/framework'
import {
  GlobalMarinadeFinanceStats,
  MarinadeFinanceStats,
  MarinadeFinanceProgramData,
  AccountType,
  MarinadeFinanceAccountInfo,
  ParsedEvents,
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
  ): Promise<Record<string, MarinadeFinanceProgramData>> {
    const accounts: Record<string, MarinadeFinanceProgramData> = {}

    await Promise.all(
      Array.from(this.accounts || []).map(async (account) => {
        const actual = await this.getAccount(account, includeStats)
        accounts[account] = actual as MarinadeFinanceProgramData
      }),
    )

    return accounts
  }

  async getAccount(
    account: string,
    includeStats?: boolean,
  ): Promise<MarinadeFinanceProgramData> {
    const info = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getAccountInfo',
    })) as MarinadeFinanceAccountInfo

    if (!includeStats) return { info }

    const { stats } = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getMarinadeFinanceStats',
    })) as AccountStats<MarinadeFinanceStats>

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
    const accountsStats = await this.getAccountStats(accountAddresses)
    const globalStats: GlobalMarinadeFinanceStats = this.getNewGlobalStats()

    for (const accountStats of accountsStats) {
      if (!accountStats.stats) continue

      const { totalRequests, totalUniqueAccessingPrograms, totalAccounts } =
        accountStats.stats

      const type = this.discoverer.getAccountType(accountStats.account)

      globalStats.totalAccounts[type] += totalAccounts[type]
      globalStats.totalRequests += totalRequests
      globalStats.totalUniqueAccessingPrograms += totalUniqueAccessingPrograms
    }
    return globalStats
  }

  getNewGlobalStats(): GlobalMarinadeFinanceStats {
    return {
      totalRequests: 0,
      totalAccounts: {
        [AccountType.State]: 0,
        [AccountType.TicketAccountData]: 0,
      },
      totalUniqueAccessingPrograms: 0,
    }
  }
}
