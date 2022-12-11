import { pipeline } from 'stream'
import { promisify } from 'util'
import {
  SolanaInstructionContextV1,
  SolanaParsedInnerInstructionV1,
  SolanaParsedInstructionV1,
  SolanaParsedTransactionV1,
  SolanaParsedTransactionContextV1,
  Utils,
} from '@aleph-indexer/core'
import {
  IndexerDomainContext,
  TransactionDateRangeResponse,
} from '../../../../../services/indexer/src/types.js'

const { StreamFilter, StreamMap, StreamBuffer } = Utils

export type SolanaIndexerWorkerDomainI = {
  solanaFilterTransaction?(
    ctx: SolanaParsedTransactionContextV1,
  ): Promise<boolean>
  solanaIndexTransaction?(
    ctx: SolanaParsedTransactionContextV1,
  ): Promise<SolanaParsedTransactionContextV1>
  solanaFilterInstructions(
    ixsContext: SolanaInstructionContextV1[],
  ): Promise<SolanaInstructionContextV1[]>
  solanaIndexInstructions(
    ixsContext: SolanaInstructionContextV1[],
  ): Promise<void>
}

export default class SolanaIndexerWorkerDomain {
  constructor(
    protected context: IndexerDomainContext,
    protected hooks: SolanaIndexerWorkerDomainI,
  ) {}

  async onTxDateRange(response: TransactionDateRangeResponse): Promise<void> {
    const { txs } = response

    const filterTransaction =
      this.hooks.solanaFilterTransaction || this.filterTransaction
    const indexTransaction =
      this.hooks.solanaIndexTransaction || this.indexTransaction
    const filterInstructions = this.hooks.solanaFilterInstructions
    const indexInstructions = this.hooks.solanaIndexInstructions

    return promisify(pipeline)(
      txs as any,
      new StreamMap(this.mapTransactionContext.bind(this, response)),
      new StreamFilter(filterTransaction.bind(this)),
      new StreamMap(indexTransaction.bind(this)),
      new StreamMap(this.mapTransaction.bind(this)),
      new StreamMap(filterInstructions.bind(this)),
      new StreamBuffer(1000),
      new StreamMap(indexInstructions.bind(this)),
    )
  }

  protected mapTransactionContext(
    args: TransactionDateRangeResponse,
    tx: SolanaParsedTransactionV1,
  ): SolanaParsedTransactionContextV1 {
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
    ixs: (SolanaParsedInstructionV1 | SolanaParsedInnerInstructionV1)[],
    ctx: SolanaParsedTransactionContextV1,
    parentIx?: SolanaParsedInstructionV1,
    ixsCtx: SolanaInstructionContextV1[] = [],
  ): SolanaInstructionContextV1[] {
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
    ctx: SolanaParsedTransactionContextV1,
  ): Promise<boolean> {
    return true
  }

  protected async indexTransaction(
    ctx: SolanaParsedTransactionContextV1,
  ): Promise<SolanaParsedTransactionContextV1> {
    return ctx
  }

  protected async mapTransaction(
    ctx: SolanaParsedTransactionContextV1,
  ): Promise<SolanaInstructionContextV1[]> {
    if (ctx.tx.parsed === undefined) {
      console.log('wrong parsed tx --->', JSON.stringify(ctx, null, 2))
      return this.groupInstructions([], ctx)
    }

    const instructions = ctx.tx.parsed.message.instructions
    return this.groupInstructions(instructions, ctx)
  }
}
