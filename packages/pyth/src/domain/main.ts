import {
  AccountIndexerConfigWithMeta,
  AccountStats,
  AccountTimeSeriesStats,
  IndexerMainDomain,
  IndexerMainDomainContext,
  IndexerMainDomainWithDiscovery,
  IndexerMainDomainWithStats,
} from '@aleph-indexer/framework'
import {
  Candle,
  CandleInterval,
  PythAccountData,
  PythAccountStats,
  GlobalPythStats,
  Price,
  PythAccountInfo,
} from '../types.js'
import DiscoveryHelper from './discovery.js'
import { StorageStream } from '@aleph-indexer/core'
import { ParsedAccountsData } from '../layouts/solita/index.js'
import { ProductData } from '../utils/pyth-sdk.js'

export default class MainDomain
  extends IndexerMainDomain
  implements IndexerMainDomainWithDiscovery, IndexerMainDomainWithStats
{
  protected stats!: GlobalPythStats

  constructor(
    protected context: IndexerMainDomainContext,
    protected discoverer: DiscoveryHelper = new DiscoveryHelper(),
  ) {
    super(context, {
      discoveryInterval: 1000 * 60 * 60 * 1,
      stats: 1000 * 60 * 5,
    })
  }

  async updateStats(now: number): Promise<void> {
    this.stats = await this.computeGlobalStats()
  }

  async discoverAccounts(): Promise<
    AccountIndexerConfigWithMeta<PythAccountInfo>[]
  > {
    const products = await this.discoverer.loadAccounts()

    return products.map((meta) => {
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
  ): Promise<Record<string, PythAccountData>> {
    const accounts: Record<string, PythAccountData> = {}

    await Promise.all(
      Array.from(this.accounts || []).map(async (account) => {
        const actual = await this.getAccount(account, includeStats)
        accounts[account] = actual as PythAccountData
      }),
    )

    return accounts
  }

  async getAccount(
    account: string,
    includeStats?: boolean,
  ): Promise<PythAccountData> {
    const info = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getPythAccountInfo',
    })) as PythAccountInfo

    if (!includeStats) return { info }

    const { stats } = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getPythAccountStats',
    })) as AccountStats<PythAccountStats>

    return { info, stats }
  }

  async getHistoricalPrices(
    account: string,
    startDate: number,
    endDate?: number,
    opts?: any,
  ): Promise<StorageStream<string, Price>> {
    const stream = await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getHistoricalPrices',
      args: [startDate, endDate, opts],
    })
    console.log('getHistoricalPrices stream', typeof stream)
    return stream as StorageStream<string, Price>
  }

  async getCandles(
    account: string,
    candleSize: CandleInterval,
    startDate: number,
    endDate?: number,
    opts?: any,
  ): Promise<AccountTimeSeriesStats<Candle>> {
    const stats = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getCandles',
      args: [candleSize, startDate, endDate, opts],
    })) as AccountTimeSeriesStats
    console.log('getCandles stats', typeof stats)
    return stats
  }

  async getGlobalStats(): Promise<GlobalPythStats> {
    return (this.stats ??= await this.computeGlobalStats())
  }

  protected async computeGlobalStats(): Promise<GlobalPythStats> {
    const accounts = await this.getAccounts(false)

    const globalStats: GlobalPythStats = this.getNewGlobalStats()
    for (const account of Object.values(accounts)) {
      const data = account.info.data
      if (this.isProductAccount(data)) {
        globalStats.totalDataFeeds++
        switch (data.product.assetType) {
          case 'Crypto':
            globalStats.totalCryptoDataFeeds++
            break
          case 'Equity':
            globalStats.totalEquityDataFeeds++
            break
          case 'FX':
            globalStats.totalFXDataFeeds++
            break
          case 'Metal':
            globalStats.totalMetalDataFeeds++
            break
        }
      }
    }
    return globalStats
  }

  protected isProductAccount(
    accountInfo: ParsedAccountsData,
  ): accountInfo is ProductData {
    return (accountInfo as ProductData).priceAccountKey !== undefined
  }

  protected getNewGlobalStats(): GlobalPythStats {
    return {
      totalDataFeeds: 0,
      totalCryptoDataFeeds: 0,
      totalEquityDataFeeds: 0,
      totalFXDataFeeds: 0,
      totalMetalDataFeeds: 0,
    }
  }
}
