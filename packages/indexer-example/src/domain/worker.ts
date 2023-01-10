import { EthereumParsedTransactionContextV1 } from '@aleph-indexer/core'
import {
  IndexerDomainContext,
  AccountIndexerConfigWithMeta,
  IndexerWorkerDomain,
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
  EthereumIndexerWorkerDomainI,
} from '@aleph-indexer/framework'
import { eventParser as eParser } from '../parsers/event.js'
import { createEventDAL } from '../dal/event.js'
import { ACCOUNT_MAP } from '../constants.js'

export default class WorkerDomain
  extends IndexerWorkerDomain
  implements EthereumIndexerWorkerDomainI
{
  constructor(
    protected context: IndexerDomainContext,
    protected eventParser = eParser,
    protected eventDAL = createEventDAL(context.dataPath),
    protected statsStateDAL = createStatsStateDAL(context.dataPath),
    protected statsTimeSeriesDAL = createStatsTimeSeriesDAL(context.dataPath),
    protected programId = ACCOUNT_MAP[context.projectId],
  ) {
    super(context)
  }

  async ethereumFilterTransaction(
    ctx: EthereumParsedTransactionContextV1,
  ): Promise<boolean> {
    return true
  }

  async ethereumIndexTransaction(
    ctx: EthereumParsedTransactionContextV1,
  ): Promise<EthereumParsedTransactionContextV1> {
    console.log('Index ETH transaction', ctx)
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
