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
  EthereumParsedLog,
  EthereumParsedTransaction,
} from '../services/parser/src/types.js'

const { StreamFilter, StreamMap, StreamBuffer } = Utils

export type EthereumTransactionIndexerWorkerDomainI = {
  ethereumTransactionBufferLength?: number // default 1000
  ethereumFilterTransaction(
    context: ParserContext,
    entity: EthereumParsedTransaction,
  ): Promise<boolean>
  ethereumIndexTransactions(
    context: ParserContext,
    entities: EthereumParsedTransaction[],
  ): Promise<void>
}

export type EthereumLogIndexerWorkerDomainI = {
  ethereumLogBufferLength?: number // default 1000
  ethereumFilterLog(
    context: ParserContext,
    entity: EthereumParsedLog,
  ): Promise<boolean>
  ethereumIndexLogs(
    context: ParserContext,
    entities: EthereumParsedLog[],
  ): Promise<void>
}

export type EthereumIndexerWorkerDomainI =
  EthereumTransactionIndexerWorkerDomainI & EthereumLogIndexerWorkerDomainI

export class EthereumIndexerWorkerDomain {
  constructor(
    protected context: IndexerDomainContext,
    protected hooks: EthereumIndexerWorkerDomainI,
  ) {
    this.checkEthereumIndexerHooks()
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
    response: EntityDateRangeResponse<EthereumParsedTransaction>,
  ): Promise<void> {
    const { entities, ...context } = response

    const filterTransaction = this.hooks.ethereumFilterTransaction.bind(
      this.hooks,
      context,
    )
    const indexTransactions = this.hooks.ethereumIndexTransactions.bind(
      this.hooks,
      context,
    )

    await promisify(pipeline)(
      entities,
      new StreamFilter(filterTransaction),
      new StreamBuffer(this.hooks.ethereumTransactionBufferLength || 1000),
      new StreamMap(indexTransactions),
    )
  }

  protected async onLogDateRange(
    response: EntityDateRangeResponse<EthereumParsedLog>,
  ): Promise<void> {
    const { entities, ...context } = response

    const filterLog = this.hooks.ethereumFilterLog.bind(this.hooks, context)
    const indexLogs = this.hooks.ethereumIndexLogs.bind(this.hooks, context)

    await promisify(pipeline)(
      entities,
      new StreamFilter(filterLog),
      new StreamBuffer(this.hooks.ethereumLogBufferLength || 1000),
      new StreamMap(indexLogs),
    )
  }

  protected checkEthereumIndexerHooks(): void {
    if (
      (this.hooks.ethereumFilterTransaction === undefined ||
        this.hooks.ethereumIndexTransactions === undefined) &&
      (this.hooks.ethereumFilterLog === undefined ||
        this.hooks.ethereumIndexLogs === undefined)
    ) {
      throw new Error(
        'EthereumIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
  }

  protected checkEthereumTransactionIndexerHooks(): void {
    if (
      this.hooks.ethereumFilterTransaction === undefined ||
      this.hooks.ethereumIndexTransactions === undefined
    ) {
      throw new Error(
        'EthereumTransactionIndexerWorkerDomainI or EthereumIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
  }

  protected checkEthereumLogIndexerHooks(): void {
    if (
      this.hooks.ethereumFilterLog === undefined ||
      this.hooks.ethereumIndexLogs === undefined
    ) {
      throw new Error(
        'EthereumLogIndexerWorkerDomainI or EthereumIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
  }
}

export async function ethereumWorkerDomainFactory(
  context: IndexerDomainContext,
  hooks: EthereumIndexerWorkerDomainI,
): Promise<BlockchainIndexerWorkerI<EthereumParsedTransaction>> {
  return new EthereumIndexerWorkerDomain(context, hooks)
}
