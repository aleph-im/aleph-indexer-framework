import {
  IndexerDomainContext,
  AccountIndexerConfigWithMeta,
  IndexerWorkerDomain,
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
  EthereumIndexerWorkerDomainI,
} from '@aleph-indexer/framework'
import { createEventDAL } from '../dal/event.js'
import { EthereumParsedTransactionContext } from '@aleph-indexer/framework'

export default class WorkerDomain
  extends IndexerWorkerDomain
  implements EthereumIndexerWorkerDomainI
{
  constructor(
    protected context: IndexerDomainContext,
    protected eventDAL = createEventDAL(context.dataPath),
    protected statsStateDAL = createStatsStateDAL(context.dataPath),
    protected statsTimeSeriesDAL = createStatsTimeSeriesDAL(context.dataPath),
  ) {
    super(context)
  }

  async ethereumFilterTransaction(
    ctx: EthereumParsedTransactionContext,
  ): Promise<boolean> {
    return true
  }

  async ethereumIndexTransaction(
    ctx: EthereumParsedTransactionContext,
  ): Promise<EthereumParsedTransactionContext> {
    console.log('Index ETH transaction', JSON.stringify(ctx, null, 2))
    return ctx
  }

  async onNewAccount(
    config: AccountIndexerConfigWithMeta<undefined>,
  ): Promise<void> {
    const { account, meta } = config
    const { projectId, instanceName, apiClient: indexerApi } = this.context

    console.log('Account indexing', instanceName, account)
  }
}
