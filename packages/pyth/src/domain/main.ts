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
  DataFeedData,
  DataFeedInfo,
  DataFeedStats,
  GlobalPythStats,
  Price,
} from '../types.js'
import { DiscoveryHelper, discoveryHelper } from './discovery.js'
import { StorageStream } from '@aleph-indexer/core'

export default class MainDomain
  extends IndexerMainDomain
  implements IndexerMainDomainWithDiscovery, IndexerMainDomainWithStats
{
  protected stats!: GlobalPythStats

  constructor(
    protected context: IndexerMainDomainContext,
    protected discoverer: DiscoveryHelper = discoveryHelper,
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
    AccountIndexerConfigWithMeta<DataFeedInfo>[]
  > {
    const products = await this.discoverer.loadProducts()

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

  async getDataFeeds(
    includeStats?: boolean,
  ): Promise<Record<string, DataFeedData>> {
    const dataFeedData: Record<string, DataFeedData> = {}

    await Promise.all(
      Array.from(this.accounts || []).map(async (account) => {
        const feedData = await this.getDataFeed(account, includeStats)
        dataFeedData[account] = feedData as DataFeedData
      }),
    )

    return dataFeedData
  }

  async getDataFeed(
    account: string,
    includeStats?: boolean,
  ): Promise<DataFeedData> {
    const info = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getDataFeedInfo',
    })) as DataFeedInfo

    if (!includeStats) return { info }

    const { stats } = (await this.context.apiClient.invokeDomainMethod({
      account,
      method: 'getDataFeedStats',
    })) as AccountStats<DataFeedStats>

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
    const dataFeeds = await this.getDataFeeds(false)

    const globalStats: GlobalPythStats = this.getNewGlobalStats()
    for (const dataFeed of Object.values(dataFeeds)) {
      globalStats.totalDataFeeds++

      switch (dataFeed.info.product.asset_type) {
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
    return globalStats
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
