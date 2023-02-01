import {
  IndexerDomainContext,
  AccountIndexerConfigWithMeta,
  IndexerWorkerDomain,
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
} from '@aleph-indexer/framework'
import {
  EthereumIndexerWorkerDomainI,
  EthereumParsedLogContext,
  EthereumParsedTransactionContext,
} from '@aleph-indexer/ethereum'
import {
  SolanaIndexerWorkerDomainI,
  SolanaParsedInstructionContext,
} from '@aleph-indexer/solana'

export default class WorkerDomain
  extends IndexerWorkerDomain
  implements EthereumIndexerWorkerDomainI, SolanaIndexerWorkerDomainI
{
  constructor(
    protected context: IndexerDomainContext,
    protected statsStateDAL = createStatsStateDAL(context.dataPath),
    protected statsTimeSeriesDAL = createStatsTimeSeriesDAL(context.dataPath),
  ) {
    super(context)
  }

  // Common hooks

  async onNewAccount(
    config: AccountIndexerConfigWithMeta<undefined>,
  ): Promise<void> {
    const { account, meta } = config
    const { projectId, instanceName, apiClient: indexerApi } = this.context

    console.log('Account indexing', instanceName, account)
  }

  // Solana mandatory hooks implemented

  async solanaFilterInstructions(
    ixsContext: SolanaParsedInstructionContext[],
  ): Promise<SolanaParsedInstructionContext[]> {
    return ixsContext
  }

  async solanaIndexInstructions(
    ixsContext: SolanaParsedInstructionContext[],
  ): Promise<void> {
    console.log('Index solana transaction', JSON.stringify(ixsContext, null, 2))
  }

  // Ethereum mandatory hooks implemented

  async ethereumFilterTransaction(
    ctx: EthereumParsedTransactionContext,
  ): Promise<boolean> {
    return true
  }

  async ethereumIndexTransaction(
    ctx: EthereumParsedTransactionContext,
  ): Promise<void> {
    console.log('Index ethereum transaction', JSON.stringify(ctx, null, 2))
  }

  async ethereumFilterLog(ctx: EthereumParsedLogContext): Promise<boolean> {
    console.log(ctx.entity.parsed?.signature)
    return true
  }

  async ethereumIndexLog(ctx: EthereumParsedLogContext): Promise<void> {
    console.log('Index ethereum log', JSON.stringify(ctx, null, 2))
  }
}
