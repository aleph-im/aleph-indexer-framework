import { pipeline } from 'stream'
import { promisify } from 'util'
import {
  InstructionContextV1,
  ParsedInnerInstructionV1,
  ParsedInstructionV1,
  ParsedTransactionV1,
  StorageValueStream,
  Utils,
} from '@aleph-indexer/core'
import {
  AccountIndexerRequestArgs,
  IndexerDomainContext,
  IndexerWorkerDomainI,
  TransactionDateRangeResponse,
} from '../../../services/indexer/src/types.js'
import {
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats,
} from '../../stats/index.js'

const { StreamFilter, StreamMap, StreamBuffer } = Utils

export type IndexerWorkerDomainWithStats = {
  updateStats(account: string, now: number): Promise<void>
  getTimeSeriesStats(
    account: string,
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats>
  getStats(account: string): Promise<AccountStats>
}

export abstract class IndexerWorkerDomain implements IndexerWorkerDomainI {
  protected instance!: number

  constructor(protected context: IndexerDomainContext) {
    this.instance = Number(context.instanceName.split('-')[1])
  }

  abstract init(): Promise<void>
  abstract onNewAccount(config: AccountIndexerRequestArgs): Promise<void>

  async onTxDateRange({
    account,
    startDate,
    endDate,
    txs,
  }: TransactionDateRangeResponse): Promise<void> {
    console.log('Processing', account, startDate, endDate)
    await this.processTransactions(txs)
  }

  protected async processTransactions(
    txs: StorageValueStream<ParsedTransactionV1>,
  ): Promise<void> {
    return promisify(pipeline)(
      txs as any,
      new StreamFilter(this.filterTransaction.bind(this)),
      new StreamMap(this.indexTransaction.bind(this)),
      new StreamMap(this.mapTransaction.bind(this)),
      new StreamMap(this.filterInstructions.bind(this)),
      new StreamBuffer(1000),
      new StreamMap(this.indexInstructions.bind(this)),
    )
  }

  protected groupInstructions(
    ixs: (ParsedInstructionV1 | ParsedInnerInstructionV1)[],
    parentTx: ParsedTransactionV1,
    parentIx?: ParsedInstructionV1,
    ixsCtx: InstructionContextV1[] = [],
  ): InstructionContextV1[] {
    for (const ix of ixs) {
      // @note: index inner ixs before
      if ('innerInstructions' in ix && ix.innerInstructions) {
        this.groupInstructions(ix.innerInstructions, parentTx, ix, ixsCtx)
      }

      ixsCtx.push({ ix, parentTx, parentIx })
    }

    return ixsCtx
  }

  protected async filterTransaction(tx: ParsedTransactionV1): Promise<boolean> {
    return true
  }

  protected async indexTransaction(
    tx: ParsedTransactionV1,
  ): Promise<ParsedTransactionV1> {
    return tx
  }

  protected async mapTransaction(
    tx: ParsedTransactionV1,
  ): Promise<InstructionContextV1[]> {
    if (tx.parsed === undefined) {
      console.log('wrong parsed tx --->', JSON.stringify(tx, null, 2))
    }

    const instructions = tx.parsed.message.instructions
    return this.groupInstructions(instructions, tx)
  }

  protected abstract filterInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<InstructionContextV1[]>

  protected abstract indexInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<void>
}
