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

    const filterTransaction = this.hooks[
      `${this.blockchainId}FilterTransaction`
    ].bind(this.hooks, context)

    const indexTransactions = this.hooks[
      `${this.blockchainId}IndexTransactions`
    ].bind(this.hooks, context)

    await promisify(pipeline)(
      entities,
      new StreamFilter(filterTransaction),
      new StreamBuffer(
        this.hooks[`${this.blockchainId}TransactionBufferLength`] || 1000,
      ),
      new StreamMap(indexTransactions),
    )
  }

  protected async onLogDateRange(
    response: EntityDateRangeResponse<EthereumParsedLog>,
  ): Promise<void> {
    const { entities, ...context } = response

    const filterLog = this.hooks[`${this.blockchainId}FilterLog`].bind(
      this.hooks,
      context,
    )

    const indexLogs = this.hooks[`${this.blockchainId}IndexLogs`].bind(
      this.hooks,
      context,
    )

    await promisify(pipeline)(
      entities,
      new StreamFilter(filterLog),
      new StreamBuffer(
        this.hooks[`${this.blockchainId}LogBufferLength`] || 1000,
      ),
      new StreamMap(indexLogs),
    )
  }

  protected checkEthereumIndexerHooks(): void {
    if (
      (this.hooks[`${this.blockchainId}FilterTransaction`] === undefined ||
        this.hooks[`${this.blockchainId}IndexTransactions`] === undefined) &&
      (this.hooks[`${this.blockchainId}FilterLog`] === undefined ||
        this.hooks[`${this.blockchainId}IndexLogs`] === undefined)
    ) {
      throw new Error(
        `${this.blockchainId}IndexerWorkerDomainI must be implemented on WorkerDomain class`,
      )
    }
  }

  protected checkEthereumTransactionIndexerHooks(): void {
    if (
      this.hooks[`${this.blockchainId}FilterTransaction`] === undefined ||
      this.hooks[`${this.blockchainId}IndexTransactions`] === undefined
    ) {
      throw new Error(
        `${this.blockchainId}TransactionIndexerWorkerDomainI or EthereumIndexerWorkerDomainI must be implemented on WorkerDomain class`,
      )
    }
  }

  protected checkEthereumLogIndexerHooks(): void {
    if (
      this.hooks[`${this.blockchainId}FilterLog`] === undefined ||
      this.hooks[`${this.blockchainId}IndexLogs`] === undefined
    ) {
      throw new Error(
        `${this.blockchainId}LogIndexerWorkerDomainI or EthereumIndexerWorkerDomainI must be implemented on WorkerDomain class`,
      )
    }
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
