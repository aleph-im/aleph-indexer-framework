import {
  AccountIndexerConfigWithMeta,
  AccountIndexerRequestArgs,
  EntityDateRangeResponse,
  IndexerDomainContext,
  IndexerWorkerDomainI,
} from '../../../services/indexer/src/types.js'
import { Blockchain, ParsedEntity } from '../../../types.js'
import {
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats,
} from '../../stats/index.js'
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
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats>
  getStats(account: string): Promise<AccountStats>
}

export interface BlockchainIndexerWorkerI<T extends ParsedEntity<unknown>> {
  onEntityDateRange(response: EntityDateRangeResponse<T>): Promise<void>
}

/**
 * Describes an indexer worker domain, implements some common methods for any instance
 */
export abstract class IndexerWorkerDomain<
  T extends ParsedEntity<unknown> = ParsedEntity<unknown>,
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

  abstract onNewAccount(
    config: AccountIndexerConfigWithMeta<unknown> | AccountIndexerRequestArgs,
  ): Promise<void>

  async onEntityDateRange(response: EntityDateRangeResponse<T>): Promise<void> {
    const { blockchainId, type, account, startDate, endDate } = response

    console.log(
      `${blockchainId} ${type} | processing entities`,
      account,
      startDate,
      endDate,
    )

    const worker = this.blockchainInstances[blockchainId]
    await worker.onEntityDateRange(response)
  }
}
