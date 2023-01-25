import {
  AccountIndexerRequestArgs,
  IndexerDomainContext,
  IndexerWorkerDomainI,
  TransactionDateRangeResponse,
} from '../../../../services/indexer/src/base/types.js'
import { Blockchain, ParsedTransaction } from '../../../../types/common.js'
import {
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats,
} from '../../../stats/index.js'
import { BlockchainWorkerFactory } from './factory.js'

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

export interface BlockchainIndexerWorkerI<
  T extends ParsedTransaction<unknown>,
> {
  onTxDateRange(response: TransactionDateRangeResponse<T>): Promise<void>
}

export type { EthereumIndexerWorkerDomainI } from './impl/ethereum.js'
export type { SolanaIndexerWorkerDomainI } from './impl/solana.js'

/**
 * Describes an indexer worker domain, implements some common methods for any instance
 */
export abstract class IndexerWorkerDomain<
  T extends ParsedTransaction<unknown> = ParsedTransaction<unknown>,
> implements IndexerWorkerDomainI
{
  protected instance!: number

  constructor(protected context: IndexerDomainContext) {
    this.instance = Number(context.instanceName.split('-')[1])
  }

  async init(): Promise<void> {
    // @note: Preload supported blockchains
    for (const blockchainId of this.context.supportedBlockchains) {
      await this.getBlockchainWorker(blockchainId)
    }
  }

  abstract onNewAccount(config: AccountIndexerRequestArgs): Promise<void>

  async onTxDateRange(
    response: TransactionDateRangeResponse<T>,
  ): Promise<void> {
    const { blockchainId, account, startDate, endDate } = response

    console.log('Processing', blockchainId, account, startDate, endDate)

    const worker = await this.getBlockchainWorker(blockchainId)
    await worker.onTxDateRange(response)
  }

  protected async getBlockchainWorker(
    blockchainId: Blockchain,
  ): Promise<BlockchainIndexerWorkerI<T>> {
    return BlockchainWorkerFactory.getSingleton(
      blockchainId,
      'default',
      this.context,
      this,
    )
  }
}
