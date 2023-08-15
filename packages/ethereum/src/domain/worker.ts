/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { pipeline } from 'stream'
import { promisify } from 'util'
import { Utils } from '@aleph-indexer/core'
import {
  BlockchainIndexerWorkerI,
  IndexerDomainContext,
  ParserContext,
  BlockchainId,
  EntityDateRangeResponse,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import {
  EthereumParsedLog,
  EthereumParsedTransaction,
} from '../services/parser/src/types'

const { StreamFilter, StreamMap, StreamBuffer } = Utils

export class EthereumIndexerWorkerDomain {
  constructor(
    protected blockchainId: BlockchainId,
    protected context: IndexerDomainContext,
    protected hooks: any,
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

    const filterTransaction = this.getBlockchainMethod(
      'filter-transaction',
    ).bind(this.hooks, context)

    const indexTransactions = this.getBlockchainMethod(
      'index-transactions',
    ).bind(this.hooks, context)

    const transactionsBuffer =
      this.getBlockchainMethod('transaction-buffer-length', false) || 1000

    await promisify(pipeline)(
      entities,
      new StreamFilter(filterTransaction),
      new StreamBuffer(transactionsBuffer),
      new StreamMap(indexTransactions),
    )
  }

  protected async onLogDateRange(
    response: EntityDateRangeResponse<EthereumParsedLog>,
  ): Promise<void> {
    const { entities, ...context } = response

    const filterLog = this.getBlockchainMethod('filter-log').bind(
      this.hooks,
      context,
    )

    const indexLogs = this.getBlockchainMethod('index-logs').bind(
      this.hooks,
      context,
    )

    const logsBuffer =
      this.getBlockchainMethod('log-buffer-length', false) || 1000

    await promisify(pipeline)(
      entities,
      new StreamFilter(filterLog),
      new StreamBuffer(logsBuffer),
      new StreamMap(indexLogs),
    )
  }

  protected checkEthereumIndexerHooks(): void {
    const hasSomeMethod = [
      'filter-transaction',
      'index-transactions',
      'filter-log',
      'index-logs',
    ].some((method) => this.getBlockchainMethod(method, false))

    if (!hasSomeMethod) {
      throw new Error(
        `${Utils.capitalize(
          Utils.toCamelCase(this.blockchainId),
        )}IndexerWorkerDomainI interface must be implemented on WorkerDomain class`,
      )
    }
  }

  protected checkEthereumTransactionIndexerHooks(): void {
    ;['filter-transaction', 'index-transactions'].every((method) =>
      this.getBlockchainMethod(method),
    )
  }

  protected checkEthereumLogIndexerHooks(): void {
    ;['filter-log', 'index-logs'].every((method) =>
      this.getBlockchainMethod(method),
    )
  }

  protected getBlockchainMethod(name: string, mandatory = true): any {
    const methodName = Utils.toCamelCase(`${this.blockchainId}-${name}`)
    const method = this.hooks[methodName]

    if (mandatory && !method) {
      throw new Error(
        `${methodName} method not found on the IndexerWorkerDomain class. ${Utils.capitalize(
          Utils.toCamelCase(this.blockchainId),
        )}IndexerWorkerDomainI interface must be implemented on WorkerDomain class`,
      )
    }

    return method
  }
}

// --------------------

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

export async function ethereumWorkerDomainFactory(
  blockchainId: BlockchainId,
  context: IndexerDomainContext,
  hooks: any,
): Promise<BlockchainIndexerWorkerI<EthereumParsedTransaction>> {
  return new EthereumIndexerWorkerDomain(blockchainId, context, hooks)
}
