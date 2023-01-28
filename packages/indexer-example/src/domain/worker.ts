import {
  IndexerDomainContext,
  AccountIndexerConfigWithMeta,
  IndexerWorkerDomain,
  createTimeFrameStateDAL,
  createStatsTimeSeriesDAL,
} from '@aleph-indexer/framework'
import {
  EthereumIndexerWorkerDomainI,
  EthereumParsedTransactionContext,
} from '@aleph-indexer/ethereum'
import {
  SolanaIndexerWorkerDomainI,
  SolanaInstructionContext,
} from '@aleph-indexer/solana'

export default class WorkerDomain
  extends IndexerWorkerDomain
  implements EthereumIndexerWorkerDomainI, SolanaIndexerWorkerDomainI
{
  constructor(
    protected context: IndexerDomainContext,
    protected statsStateDAL = createTimeFrameStateDAL(context.dataPath),
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
    ixsContext: SolanaInstructionContext[],
  ): Promise<SolanaInstructionContext[]> {
    return ixsContext
  }

  async solanaIndexInstructions(
    ixsContext: SolanaInstructionContext[],
  ): Promise<void> {
    console.log('Index SOL transaction', JSON.stringify(ixsContext, null, 2))
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
    console.log('Index ETH transaction', JSON.stringify(ctx, null, 2))
  }
}
