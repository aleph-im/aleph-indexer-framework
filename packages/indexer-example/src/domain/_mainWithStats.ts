import {
  Blockchain,
  IndexerMainDomain,
  IndexerMainDomainContext,
  IndexerMainDomainWithStats,
  AccountStatsFilters,
  AccountTimeSeriesStats,
  AccountStats,
} from '@aleph-indexer/framework'

export default class MainDomain
  extends IndexerMainDomain
  implements IndexerMainDomainWithStats
{
  constructor(protected context: IndexerMainDomainContext) {
    super(context)
  }

  // Implement the updateStats method
  async updateStats(now: number): Promise<void> {
    // Logic for updating stats
    // this entails
    // -
  }

  // Implement the getAccountTimeSeriesStats method
  async getAccountTimeSeriesStats(
    blockchainId: Blockchain,
    accounts: string[],
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats[]> {
    // Logic for retrieving and transforming time-series stats for specified accounts
    return []
  }

  // Implement the getAccountStats method
  async getAccountStats(
    blockchainId: Blockchain,
    accounts: string[],
  ): Promise<AccountStats[]> {
    // Logic for retrieving global stats for specified accounts
    return []
  }
}
