import {
  IndexerDomainContext,
  AccountIndexerConfigWithMeta,
  IndexerWorkerDomain,
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
  ParserContext,
} from '@aleph-indexer/framework'
import {
  EthereumIndexerWorkerDomainI,
  EthereumParsedLog,
  EthereumParsedTransaction,
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
  transactionBufferLength?: number | undefined
  instructionBufferLength?: number | undefined

  // Common hooks

  async onNewAccount(
    config: AccountIndexerConfigWithMeta<undefined>,
  ): Promise<void> {
    const { account } = config
    const { instanceName } = this.context

    console.log('Account indexing', instanceName, account)
  }

  // Solana

  async solanaFilterInstruction(
    context: ParserContext,
    entity: SolanaParsedInstructionContext,
  ): Promise<boolean> {
    return true
  }

  async solanaIndexInstructions(
    context: ParserContext,
    entities: SolanaParsedInstructionContext[],
  ): Promise<void> {
    console.log('Index solana transaction', JSON.stringify(entities, null, 2))
  }

  // Ethereum

  async ethereumFilterTransaction(
    context: ParserContext,
    entity: EthereumParsedTransaction,
  ): Promise<boolean> {
    return true
  }

  async ethereumIndexTransactions(
    context: ParserContext,
    entities: EthereumParsedTransaction[],
  ): Promise<void> {
    console.log('Index ethereum transaction', JSON.stringify(entities, null, 2))
  }

  async ethereumFilterLog(
    context: ParserContext,
    entity: EthereumParsedLog,
  ): Promise<boolean> {
    return true
  }

  async ethereumIndexLogs(
    context: ParserContext,
    entities: EthereumParsedLog[],
  ): Promise<void> {
    console.log('Index ethereum transaction', JSON.stringify(entities, null, 2))
  }
}
