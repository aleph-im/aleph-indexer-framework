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
import { BscIndexerWorkerDomainI } from '@aleph-indexer/bsc'
import { OasysIndexerWorkerDomainI } from '@aleph-indexer/oasys'

export default class WorkerDomain
  extends IndexerWorkerDomain
  implements
    EthereumIndexerWorkerDomainI,
    SolanaIndexerWorkerDomainI,
    BscIndexerWorkerDomainI,
    OasysIndexerWorkerDomainI
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
    console.log('Index ethereum log', JSON.stringify(entities, null, 2))
  }

  // Binance Smart Chain

  async bscFilterTransaction(
    context: ParserContext,
    entity: EthereumParsedTransaction,
  ): Promise<boolean> {
    return true
  }

  async bscIndexTransactions(
    context: ParserContext,
    entities: EthereumParsedTransaction[],
  ): Promise<void> {
    console.log('Index bsc transaction', JSON.stringify(entities, null, 2))
  }

  async bscFilterLog(
    context: ParserContext,
    entity: EthereumParsedLog,
  ): Promise<boolean> {
    return true
  }

  async bscIndexLogs(
    context: ParserContext,
    entities: EthereumParsedLog[],
  ): Promise<void> {
    console.log('Index bsc log', JSON.stringify(entities, null, 2))
  }

  // Oasys

  async oasysFilterTransaction(
    context: ParserContext,
    entity: EthereumParsedTransaction,
  ): Promise<boolean> {
    return true
  }

  async oasysIndexTransactions(
    context: ParserContext,
    entities: EthereumParsedTransaction[],
  ): Promise<void> {
    console.log('Index oasys transaction', JSON.stringify(entities, null, 2))
  }

  async oasysFilterLog(
    context: ParserContext,
    entity: EthereumParsedLog,
  ): Promise<boolean> {
    return true
  }

  async oasysIndexLogs(
    context: ParserContext,
    entities: EthereumParsedLog[],
  ): Promise<void> {
    console.log('Index oasys log', JSON.stringify(entities, null, 2))
  }
}
