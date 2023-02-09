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
  BscParsedLog,
  BscParsedTransaction,
} from '../services/parser/src/types.js'

const { StreamFilter, StreamMap, StreamBuffer } = Utils

export type BscTransactionIndexerWorkerDomainI = {
  bscTransactionBufferLength?: number // default 1000
  bscFilterTransaction(
    context: ParserContext,
    entity: BscParsedTransaction,
  ): Promise<boolean>
  bscIndexTransactions(
    context: ParserContext,
    entities: BscParsedTransaction[],
  ): Promise<void>
}

export type BscLogIndexerWorkerDomainI = {
  bscLogBufferLength?: number // default 1000
  bscFilterLog(context: ParserContext, entity: BscParsedLog): Promise<boolean>
  bscIndexLogs(context: ParserContext, entities: BscParsedLog[]): Promise<void>
}

export type BscIndexerWorkerDomainI = BscTransactionIndexerWorkerDomainI &
  BscLogIndexerWorkerDomainI

export class BscIndexerWorkerDomain {
  constructor(
    protected context: IndexerDomainContext,
    protected hooks: BscIndexerWorkerDomainI,
  ) {
    this.checkBscIndexerHooks()
  }

  async onEntityDateRange(
    response: EntityDateRangeResponse<any>,
  ): Promise<void> {
    const { type } = response

    if (type === IndexableEntityType.Transaction) {
      return this.onTransactionDateRange(response)
    }

    if (type === IndexableEntityType.Log) {
      return this.onLogDateRange(response)
    }
  }

  protected async onTransactionDateRange(
    response: EntityDateRangeResponse<BscParsedTransaction>,
  ): Promise<void> {
    const { entities, ...context } = response

    const filterTransaction = this.hooks.bscFilterTransaction.bind(
      this.hooks,
      context,
    )
    const indexTransactions = this.hooks.bscIndexTransactions.bind(
      this.hooks,
      context,
    )

    await promisify(pipeline)(
      entities,
      new StreamFilter(filterTransaction),
      new StreamBuffer(this.hooks.bscTransactionBufferLength || 1000),
      new StreamMap(indexTransactions),
    )
  }

  protected async onLogDateRange(
    response: EntityDateRangeResponse<BscParsedLog>,
  ): Promise<void> {
    const { entities, ...context } = response

    const filterLog = this.hooks.bscFilterLog.bind(this.hooks, context)
    const indexLogs = this.hooks.bscIndexLogs.bind(this.hooks, context)

    await promisify(pipeline)(
      entities,
      new StreamFilter(filterLog),
      new StreamBuffer(this.hooks.bscLogBufferLength || 1000),
      new StreamMap(indexLogs),
    )
  }

  protected checkBscIndexerHooks(): void {
    if (
      (this.hooks.bscFilterTransaction === undefined ||
        this.hooks.bscIndexTransactions === undefined) &&
      (this.hooks.bscFilterLog === undefined ||
        this.hooks.bscIndexLogs === undefined)
    ) {
      throw new Error(
        'BscIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
  }

  protected checkBscTransactionIndexerHooks(): void {
    if (
      this.hooks.bscFilterTransaction === undefined ||
      this.hooks.bscIndexTransactions === undefined
    ) {
      throw new Error(
        'BscTransactionIndexerWorkerDomainI or BscIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
  }

  protected checkBscLogIndexerHooks(): void {
    if (
      this.hooks.bscFilterLog === undefined ||
      this.hooks.bscIndexLogs === undefined
    ) {
      throw new Error(
        'BscLogIndexerWorkerDomainI or BscIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
  }
}

export async function bscWorkerDomainFactory(
  context: IndexerDomainContext,
  hooks: BscIndexerWorkerDomainI,
): Promise<BlockchainIndexerWorkerI<BscParsedTransaction>> {
  return new BscIndexerWorkerDomain(context, hooks)
}
