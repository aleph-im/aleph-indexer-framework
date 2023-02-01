import { pipeline } from 'stream'
import { promisify } from 'util'
import { Utils } from '@aleph-indexer/core'
import {
  BlockchainIndexerWorkerI,
  IndexerDomainContext,
  EntityDateRangeResponse,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import {
  SolanaParsedTransaction,
  SolanaParsedInstruction,
  SolanaParsedInnerInstruction,
} from '../types.js'
import {
  SolanaParsedInstructionContext,
  SolanaParsedTransactionContext,
} from '../services/parser/src/types.js'

const { StreamFilter, StreamMap, StreamBuffer } = Utils

export type SolanaIndexerWorkerDomainI = {
  solanaFilterTransaction?(
    ctx: SolanaParsedTransactionContext,
  ): Promise<boolean>
  solanaIndexTransaction?(
    ctx: SolanaParsedTransactionContext,
  ): Promise<SolanaParsedTransactionContext>
  solanaFilterInstructions(
    ixsContext: SolanaParsedInstructionContext[],
  ): Promise<SolanaParsedInstructionContext[]>
  solanaIndexInstructions(
    ixsContext: SolanaParsedInstructionContext[],
  ): Promise<void>
}

export default class SolanaIndexerWorkerDomain {
  constructor(
    protected context: IndexerDomainContext,
    protected hooks: SolanaIndexerWorkerDomainI,
  ) {
    if (
      this.hooks.solanaFilterInstructions === undefined ||
      this.hooks.solanaIndexInstructions === undefined
    ) {
      throw new Error(
        'SolanaIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
  }

  async onEntityDateRange(
    response: EntityDateRangeResponse<SolanaParsedTransaction>,
  ): Promise<void> {
    const { type } = response

    if (type === IndexableEntityType.Transaction) {
      return this.onTransactionDateRange(response)
    }
  }

  protected async onTransactionDateRange(
    response: EntityDateRangeResponse<SolanaParsedTransaction>,
  ): Promise<void> {
    const { entities } = response

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
      entities as any,
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
    args: EntityDateRangeResponse<SolanaParsedTransaction>,
    entity: SolanaParsedTransaction,
  ): SolanaParsedTransactionContext {
    const { account, startDate, endDate } = args

    return {
      entity,
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
    ixsCtx: SolanaParsedInstructionContext[] = [],
  ): SolanaParsedInstructionContext[] {
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
  ): Promise<SolanaParsedInstructionContext[]> {
    if (ctx.entity.parsed === undefined) {
      console.log('wrong parsed tx --->', JSON.stringify(ctx, null, 2))
      return this.groupInstructions([], ctx)
    }

    const instructions = ctx.entity.parsed.message.instructions
    return this.groupInstructions(instructions, ctx)
  }
}

export async function solanaWorkerDomainFactory(
  context: IndexerDomainContext,
  hooks: SolanaIndexerWorkerDomainI,
): Promise<BlockchainIndexerWorkerI<SolanaParsedTransaction>> {
  return new SolanaIndexerWorkerDomain(context, hooks)
}
