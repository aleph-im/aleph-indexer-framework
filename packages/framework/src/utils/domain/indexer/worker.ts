import {
  AccountIndexerRequestArgs,
  IndexerDomainContext,
  IndexerWorkerDomainI,
  TransactionDateRangeResponse,
} from '../../../services/indexer/src/types.js'
import { Blockchain, ParsedTransaction } from '../../../types.js'
import { AccountStats, AccountTimeSeriesStats, TimeSeriesStatsFilters } from '../../stats/index.js'
import { WorkerKind } from '../../workers.js'
import { importBlockchainWorkerIndexerDomain } from '../common.js'

/**
 * Describes an indexer worker domain, capable of stats processing.
 */
export type IndexerWorkerDomainWithStats = {
  updateStats(account: string, now: number): Promise<void>
  getTimeSeriesStats(
    account: string,
    type: string,
    filters: TimeSeriesStatsFilters,
  ): Promise<AccountTimeSeriesStats>
  getStats(account: string): Promise<AccountStats>
}

export interface BlockchainIndexerWorkerI<
  T extends ParsedTransaction<unknown>,
> {
  onTxDateRange(response: TransactionDateRangeResponse<T>): Promise<void>
}

/**
 * Describes an indexer worker domain, implements some common methods for any instance
 */
export abstract class IndexerWorkerDomain<
  T extends ParsedTransaction<unknown> = ParsedTransaction<unknown>,
> implements IndexerWorkerDomainI
{
  protected instance!: number
  protected blockchainInstances!: Record<
    Blockchain,
    BlockchainIndexerWorkerI<T>
  >

  constructor(protected context: IndexerDomainContext) {
    this.instance = Number(context.instanceName.split('-')[1])
  }

  async init(): Promise<void> {
    // @note: Preload supported blockchains
    this.blockchainInstances = await importBlockchainWorkerIndexerDomain(
      WorkerKind.Indexer,
      this.context.supportedBlockchains,
      this.context,
      this,
    )
  }

  abstract onNewAccount(config: AccountIndexerRequestArgs): Promise<void>

  async onTxDateRange(
    response: TransactionDateRangeResponse<T>,
  ): Promise<void> {
    const { blockchainId, account, startDate, endDate } = response

    console.log('Processing', blockchainId, account, startDate, endDate)

    const worker = this.blockchainInstances[blockchainId]
    await worker.onTxDateRange(response)
  }
}
