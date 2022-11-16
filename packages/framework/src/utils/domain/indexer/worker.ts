import { pipeline } from 'stream'
import { promisify } from 'util'
import {
  InstructionContextV1,
  ParsedInnerInstructionV1,
  ParsedInstructionV1,
  ParsedTransactionV1,
  ParsedTransactionContextV1,
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
import { DateTime } from 'luxon'

const { StreamFilter, StreamMap, StreamBuffer } = Utils

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

/**
 * Describes an indexer worker domain, implements some common methods for any instance
 */
export abstract class IndexerWorkerDomain implements IndexerWorkerDomainI {
  protected instance!: number

  constructor(protected context: IndexerDomainContext) {
    this.instance = Number(context.instanceName.split('-')[1])
  }

  abstract init(): Promise<void>
  abstract onNewAccount(config: AccountIndexerRequestArgs): Promise<void>

  async onTxDateRange(response: TransactionDateRangeResponse): Promise<void> {
    const { account, startDate, endDate } = response
    console.log('Processing', account, startDate, endDate)
    await this.processTransactions(response)
  }

  protected async processTransactions(
    response: TransactionDateRangeResponse,
  ): Promise<void> {
    const { txs } = response
    return promisify(pipeline)(
      txs as any,
      new StreamMap(this.mapTransactionContext(response).bind(this)),
      new StreamFilter(this.filterTransaction.bind(this)),
      new StreamMap(this.indexTransaction.bind(this)),
      new StreamMap(this.mapTransaction.bind(this)),
      new StreamMap(this.filterInstructions.bind(this)),
      new StreamBuffer(1000),
      new StreamMap(this.indexInstructions.bind(this)),
    )
  }

  protected mapTransactionContext(args: TransactionDateRangeResponse) {
    const { account, startDate, endDate } = args
    return (tx: ParsedTransactionV1): ParsedTransactionContextV1 => {
      return {
        tx,
        parserContext: {
          account,
          startDate: DateTime.fromMillis(startDate),
          endDate: DateTime.fromMillis(endDate),
        },
      }
    }
  }

  protected groupInstructions(
    ixs: (ParsedInstructionV1 | ParsedInnerInstructionV1)[],
    ctx: ParsedTransactionContextV1,
    parentIx?: ParsedInstructionV1,
    ixsCtx: InstructionContextV1[] = [],
  ): InstructionContextV1[] {
    for (const ix of ixs) {
      // @note: index inner ixs before
      if ('innerInstructions' in ix && ix.innerInstructions) {
        this.groupInstructions(ix.innerInstructions, ctx, ix, ixsCtx)
      }

      ixsCtx.push({ ix, txContext: ctx, parentIx })
    }

    return ixsCtx
  }

  protected async filterTransaction(
    ctx: ParsedTransactionContextV1,
  ): Promise<boolean> {
    return true
  }

  protected async indexTransaction(
    ctx: ParsedTransactionContextV1,
  ): Promise<ParsedTransactionContextV1> {
    return ctx
  }

  protected async mapTransaction(
    ctx: ParsedTransactionContextV1,
  ): Promise<InstructionContextV1[]> {
    if (ctx.tx.parsed === undefined) {
      console.log('wrong parsed tx --->', JSON.stringify(ctx, null, 2))
      return this.groupInstructions([], ctx)
    }

    const instructions = ctx.tx.parsed.message.instructions
    return this.groupInstructions(instructions, ctx)
  }

  protected abstract filterInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<InstructionContextV1[]>

  protected abstract indexInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<void>
}
