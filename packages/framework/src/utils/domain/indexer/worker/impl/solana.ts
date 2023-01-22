import { pipeline } from 'stream'
import { promisify } from 'util'
import {
  SolanaInstructionContext,
  SolanaParsedInnerInstruction,
  SolanaParsedInstruction,
  SolanaParsedTransaction,
  SolanaParsedTransactionContext,
  Utils,
} from '@aleph-indexer/core'
import {
  IndexerDomainContext,
  TransactionDateRangeResponse,
} from '../../../../../services/indexer/src/base/types.js'

const { StreamFilter, StreamMap, StreamBuffer } = Utils

export type SolanaIndexerWorkerDomainI = {
  solanaFilterTransaction?(
    ctx: SolanaParsedTransactionContext,
  ): Promise<boolean>
  solanaIndexTransaction?(
    ctx: SolanaParsedTransactionContext,
  ): Promise<SolanaParsedTransactionContext>
  solanaFilterInstructions(
    ixsContext: SolanaInstructionContext[],
  ): Promise<SolanaInstructionContext[]>
  solanaIndexInstructions(ixsContext: SolanaInstructionContext[]): Promise<void>
}

export default class SolanaIndexerWorkerDomain {
  constructor(
    protected context: IndexerDomainContext,
    protected hooks: SolanaIndexerWorkerDomainI,
  ) {}

  async onTxDateRange(
    response: TransactionDateRangeResponse<SolanaParsedTransaction>,
  ): Promise<void> {
    const { txs } = response

    const filterTransaction =
      this.hooks.solanaFilterTransaction?.bind(this.hooks) ||
      this.filterTransaction.bind(this)
    const indexTransaction =
      this.hooks.solanaIndexTransaction?.bind(this.hooks) ||
      this.indexTransaction.bind(this)
    const filterInstructions = this.hooks.solanaFilterInstructions.bind(
      this.hooks,
    )
    const indexInstructions = this.hooks.solanaIndexInstructions.bind(
      this.hooks,
    )

    return promisify(pipeline)(
      txs as any,
      new StreamMap(this.mapTransactionContext.bind(this, response)),
      new StreamFilter(filterTransaction),
      new StreamMap(indexTransaction),
      new StreamMap(this.mapTransaction.bind(this)),
      new StreamMap(filterInstructions),
      new StreamBuffer(1000),
      new StreamMap(indexInstructions),
    )
  }

  protected mapTransactionContext(
    args: TransactionDateRangeResponse<SolanaParsedTransaction>,
    tx: SolanaParsedTransaction,
  ): SolanaParsedTransactionContext {
    const { account, startDate, endDate } = args

    return {
      tx,
      parserContext: {
        account,
        startDate,
        endDate,
      },
    }
  }

  protected groupInstructions(
    ixs: (SolanaParsedInstruction | SolanaParsedInnerInstruction)[],
    ctx: SolanaParsedTransactionContext,
    parentIx?: SolanaParsedInstruction,
    ixsCtx: SolanaInstructionContext[] = [],
  ): SolanaInstructionContext[] {
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
    ctx: SolanaParsedTransactionContext,
  ): Promise<boolean> {
    return true
  }

  protected async indexTransaction(
    ctx: SolanaParsedTransactionContext,
  ): Promise<SolanaParsedTransactionContext> {
    return ctx
  }

  protected async mapTransaction(
    ctx: SolanaParsedTransactionContext,
  ): Promise<SolanaInstructionContext[]> {
    if (ctx.tx.parsed === undefined) {
      console.log('wrong parsed tx --->', JSON.stringify(ctx, null, 2))
      return this.groupInstructions([], ctx)
    }

    const instructions = ctx.tx.parsed.message.instructions
    return this.groupInstructions(instructions, ctx)
  }
}
