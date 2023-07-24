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
  OasysParsedLog,
  OasysParsedTransaction,
} from '../services/parser/src/types.js'

const { StreamFilter, StreamMap, StreamBuffer } = Utils

export type OasysTransactionIndexerWorkerDomainI = {
  oasysTransactionBufferLength?: number // default 1000
  oasysFilterTransaction(
    context: ParserContext,
    entity: OasysParsedTransaction,
  ): Promise<boolean>
  oasysIndexTransactions(
    context: ParserContext,
    entities: OasysParsedTransaction[],
  ): Promise<void>
}

export type OasysLogIndexerWorkerDomainI = {
  oasysLogBufferLength?: number // default 1000
  oasysFilterLog(
    context: ParserContext,
    entity: OasysParsedLog,
  ): Promise<boolean>
  oasysIndexLogs(
    context: ParserContext,
    entities: OasysParsedLog[],
  ): Promise<void>
}

export type OasysIndexerWorkerDomainI = OasysTransactionIndexerWorkerDomainI &
  OasysLogIndexerWorkerDomainI

export class OasysIndexerWorkerDomain {
  constructor(
    protected context: IndexerDomainContext,
    protected hooks: OasysIndexerWorkerDomainI,
  ) {
    this.checkOasysIndexerHooks()
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
    response: EntityDateRangeResponse<OasysParsedTransaction>,
  ): Promise<void> {
    const { entities, ...context } = response

    const filterTransaction = this.hooks.oasysFilterTransaction.bind(
      this.hooks,
      context,
    )
    const indexTransactions = this.hooks.oasysIndexTransactions.bind(
      this.hooks,
      context,
    )

    await promisify(pipeline)(
      entities,
      new StreamFilter(filterTransaction),
      new StreamBuffer(this.hooks.oasysTransactionBufferLength || 1000),
      new StreamMap(indexTransactions),
    )
  }

  protected async onLogDateRange(
    response: EntityDateRangeResponse<OasysParsedLog>,
  ): Promise<void> {
    const { entities, ...context } = response

    const filterLog = this.hooks.oasysFilterLog.bind(this.hooks, context)
    const indexLogs = this.hooks.oasysIndexLogs.bind(this.hooks, context)

    await promisify(pipeline)(
      entities,
      new StreamFilter(filterLog),
      new StreamBuffer(this.hooks.oasysLogBufferLength || 1000),
      new StreamMap(indexLogs),
    )
  }

  protected checkOasysIndexerHooks(): void {
    if (
      (this.hooks.oasysFilterTransaction === undefined ||
        this.hooks.oasysIndexTransactions === undefined) &&
      (this.hooks.oasysFilterLog === undefined ||
        this.hooks.oasysIndexLogs === undefined)
    ) {
      throw new Error(
        'OasysIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
  }

  protected checkOasysTransactionIndexerHooks(): void {
    if (
      this.hooks.oasysFilterTransaction === undefined ||
      this.hooks.oasysIndexTransactions === undefined
    ) {
      throw new Error(
        'OasysTransactionIndexerWorkerDomainI or OasysIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
  }

  protected checkOasysLogIndexerHooks(): void {
    if (
      this.hooks.oasysFilterLog === undefined ||
      this.hooks.oasysIndexLogs === undefined
    ) {
      throw new Error(
        'OasysLogIndexerWorkerDomainI or OasysIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
  }
}

export async function oasysWorkerDomainFactory(
  context: IndexerDomainContext,
  hooks: OasysIndexerWorkerDomainI,
): Promise<BlockchainIndexerWorkerI<OasysParsedTransaction>> {
  return new OasysIndexerWorkerDomain(context, hooks)
}
