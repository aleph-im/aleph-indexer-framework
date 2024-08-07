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
import {
  AvalancheIndexerWorkerDomainI,
  AvalancheParsedLog,
  AvalancheParsedTransaction,
} from '@aleph-indexer/avalanche'
import {
  BaseIndexerWorkerDomainI,
  BaseParsedLog,
  BaseParsedTransaction,
} from '@aleph-indexer/base'

export default class WorkerDomain
  extends IndexerWorkerDomain
  implements
    EthereumIndexerWorkerDomainI,
    SolanaIndexerWorkerDomainI,
    BscIndexerWorkerDomainI,
    OasysIndexerWorkerDomainI,
    BaseIndexerWorkerDomainI,
    AvalancheIndexerWorkerDomainI
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

  // Homeverse

  async homeverseFilterTransaction(
    context: ParserContext,
    entity: EthereumParsedTransaction,
  ): Promise<boolean> {
    return true
  }

  async homeverseIndexTransactions(
    context: ParserContext,
    entities: EthereumParsedTransaction[],
  ): Promise<void> {
    console.log(
      'Index homeverse transaction',
      JSON.stringify(entities, null, 2),
    )
  }

  async homeverseFilterLog(
    context: ParserContext,
    entity: EthereumParsedLog,
  ): Promise<boolean> {
    return true
  }

  async homeverseIndexLogs(
    context: ParserContext,
    entities: EthereumParsedLog[],
  ): Promise<void> {
    console.log('Index homeverse log', JSON.stringify(entities, null, 2))
  }

  // Base

  async baseFilterTransaction(
    context: ParserContext,
    entity: BaseParsedTransaction,
  ): Promise<boolean> {
    return true
  }

  async baseIndexTransactions(
    context: ParserContext,
    entities: BaseParsedTransaction[],
  ): Promise<void> {
    console.log('Index base transaction', JSON.stringify(entities, null, 2))
  }

  async baseFilterLog(
    context: ParserContext,
    entity: BaseParsedLog,
  ): Promise<boolean> {
    return true
  }

  async baseIndexLogs(
    context: ParserContext,
    entities: BaseParsedLog[],
  ): Promise<void> {
    console.log('Index base log', JSON.stringify(entities, null, 2))
  }

  // Avalanche

  async avalancheFilterTransaction(
    context: ParserContext,
    entity: AvalancheParsedTransaction,
  ): Promise<boolean> {
    return true
  }

  async avalancheIndexTransactions(
    context: ParserContext,
    entities: AvalancheParsedTransaction[],
  ): Promise<void> {
    console.log(
      'Index avalanche transaction',
      JSON.stringify(entities, null, 2),
    )
  }

  async avalancheFilterLog(
    context: ParserContext,
    entity: AvalancheParsedLog,
  ): Promise<boolean> {
    return true
  }

  async avalancheIndexLogs(
    context: ParserContext,
    entities: AvalancheParsedLog[],
  ): Promise<void> {
    console.log('Index avalanche log', JSON.stringify(entities, null, 2))
  }
}
