import { pipeline } from 'stream'
import { promisify } from 'util'
import { Utils } from '@aleph-indexer/core'
import {
  BlockchainIndexerWorkerI,
  IndexerDomainContext,
  EntityDateRangeResponse,
  IndexableEntityType,
  ParserContext,
} from '@aleph-indexer/framework'
import {
  SolanaParsedTransaction,
  SolanaParsedInstruction,
  SolanaParsedInnerInstruction,
} from '../types.js'
import { SolanaParsedInstructionContext } from '../services/parser/src/types.js'

const { StreamFilter, StreamMap, StreamBuffer, StreamUnBuffer } = Utils

export type SolanaTransactionIndexerWorkerDomainI = {
  solanaTransactionBufferLength?: number // default 1000
  solanaInstructionBufferLength?: number // default 1000
  solanaFilterTransaction?(
    context: ParserContext,
    entity: SolanaParsedTransaction,
  ): Promise<boolean>
  solanaIndexTransactions?(
    context: ParserContext,
    entities: SolanaParsedTransaction[],
  ): Promise<SolanaParsedTransaction[]>
  solanaFilterInstruction(
    context: ParserContext,
    entity: SolanaParsedInstructionContext,
  ): Promise<boolean>
  solanaIndexInstructions(
    context: ParserContext,
    entities: SolanaParsedInstructionContext[],
  ): Promise<void>
}

export type SolanaIndexerWorkerDomainI = SolanaTransactionIndexerWorkerDomainI

export default class SolanaIndexerWorkerDomain {
  constructor(
    protected context: IndexerDomainContext,
    protected hooks: SolanaIndexerWorkerDomainI,
  ) {
    this.checkSolanaIndexerHooks()
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
    const { entities, ...context } = response

    const filterTransaction =
      this.hooks.solanaFilterTransaction?.bind(this.hooks, context) ||
      this.filterTransaction.bind(this, context)

    const indexTransactions =
      this.hooks.solanaIndexTransactions?.bind(this.hooks, context) ||
      this.indexTransactions.bind(this, context)

    const filterInstruction = this.hooks.solanaFilterInstruction.bind(
      this.hooks,
      context,
    )

    const indexInstructions = this.hooks.solanaIndexInstructions.bind(
      this.hooks,
      context,
    )

    return promisify(pipeline)(
      entities as any,
      new StreamFilter(filterTransaction),
      new StreamBuffer(this.hooks.solanaTransactionBufferLength || 1000),
      new StreamMap(indexTransactions),
      new StreamUnBuffer(),
      new StreamMap(this.mapTransaction.bind(this)),
      new StreamMap(this.mapInstructions.bind(this, filterInstruction)),
      new StreamBuffer(this.hooks.solanaInstructionBufferLength || 1000),
      new StreamMap(indexInstructions),
    )
  }

  protected async filterTransaction(
    context: ParserContext,
    entity: SolanaParsedTransaction,
  ): Promise<boolean> {
    return true
  }

  protected async indexTransactions(
    context: ParserContext,
    entities: SolanaParsedTransaction[],
  ): Promise<SolanaParsedTransaction[]> {
    return entities
  }

  protected async mapTransaction(
    entity: SolanaParsedTransaction,
  ): Promise<SolanaParsedInstructionContext[]> {
    if (entity.parsed === undefined)
      console.log('🟥⚠️ WRONG PARSED TX ⚠️🟥', JSON.stringify(entity, null, 2))
    return this.groupInstructions(entity)
  }

  protected async mapInstructions(
    filterInstruction: (ix: SolanaParsedInstructionContext) => Promise<boolean>,
    entities: SolanaParsedInstructionContext[],
  ): Promise<SolanaParsedInstructionContext[]> {
    const promises = await Promise.all(
      entities.map(async (ix) => await filterInstruction(ix)),
    )
    return entities.filter((ix, index) => promises[index])
  }

  protected groupInstructions(
    parentTransaction: SolanaParsedTransaction,
    parentInstruction?: SolanaParsedInstruction,
    instructions: (
      | SolanaParsedInstruction
      | SolanaParsedInnerInstruction
    )[] = parentTransaction.parsed?.message?.instructions || [],
    output: SolanaParsedInstructionContext[] = [],
  ): SolanaParsedInstructionContext[] {
    for (const instruction of instructions) {
      // @note: index inner instructions before
      if ('innerInstructions' in instruction && instruction.innerInstructions) {
        this.groupInstructions(
          parentTransaction,
          instruction,
          instruction.innerInstructions,
          output,
        )
      }

      output.push({ parentTransaction, parentInstruction, instruction })
    }

    return output
  }

  protected checkSolanaIndexerHooks(): void {
    return this.checkSolanaTransactionIndexerHooks()
  }

  protected checkSolanaTransactionIndexerHooks(): void {
    if (
      this.hooks.solanaFilterInstruction === undefined ||
      this.hooks.solanaIndexInstructions === undefined
    ) {
      throw new Error(
        'SolanaTransactionIndexerWorkerDomainI or SolanaIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
  }
}

export async function solanaWorkerDomainFactory(
  context: IndexerDomainContext,
  hooks: SolanaIndexerWorkerDomainI,
): Promise<BlockchainIndexerWorkerI<SolanaParsedTransaction>> {
  return new SolanaIndexerWorkerDomain(context, hooks)
}
