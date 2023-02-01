import { pipeline } from 'stream'
import { promisify } from 'util'
import { Utils } from '@aleph-indexer/core'
import {
  BlockchainIndexerWorkerI,
  IndexerDomainContext,
  EntityDateRangeResponse,
  IndexableEntityType,
  ParsedEntity,
  ParsedEntityContext,
} from '@aleph-indexer/framework'
import {
  EthereumParsedLog,
  EthereumParsedLogContext,
  EthereumParsedTransaction,
  EthereumParsedTransactionContext,
} from '../services/parser/src/types.js'

const { StreamFilter, StreamMap, StreamBuffer } = Utils

export type EthereumTransactionIndexerWorkerDomainI = {
  ethereumFilterTransaction(
    ctx: EthereumParsedTransactionContext,
  ): Promise<boolean>
  ethereumIndexTransaction(ctx: EthereumParsedTransactionContext): Promise<void>
}

export type EthereumLogIndexerWorkerDomainI = {
  ethereumFilterLog(ctx: EthereumParsedLogContext): Promise<boolean>
  ethereumIndexLog(ctx: EthereumParsedLogContext): Promise<void>
}

export type EthereumIndexerWorkerDomainI =
  EthereumTransactionIndexerWorkerDomainI & EthereumLogIndexerWorkerDomainI

export class EthereumIndexerWorkerDomain {
  constructor(
    protected context: IndexerDomainContext,
    protected hooks: EthereumIndexerWorkerDomainI,
  ) {
    if (
      this.hooks.ethereumFilterTransaction === undefined ||
      this.hooks.ethereumIndexTransaction === undefined
    ) {
      throw new Error(
        'EthereumIndexerWorkerDomainI must be implemented on WorkerDomain class',
      )
    }
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
    const { entities } = response

    const filterTransaction = this.hooks.ethereumFilterTransaction.bind(
      this.hooks,
    )
    const indexTransaction = this.hooks.ethereumIndexTransaction.bind(
      this.hooks,
    )

    return promisify(pipeline)(
      entities as any,
      new StreamMap(this.mapEntityContext.bind(this, response)),
      new StreamFilter(filterTransaction),
      new StreamBuffer(1000),
      new StreamMap(indexTransaction),
    )
  }

  protected async onLogDateRange(
    response: EntityDateRangeResponse<EthereumParsedLog>,
  ): Promise<void> {
    const { entities } = response

    const filterLog = this.hooks.ethereumFilterLog.bind(this.hooks)
    const indexLog = this.hooks.ethereumIndexLog.bind(this.hooks)

    return promisify(pipeline)(
      entities as any,
      new StreamMap(this.mapEntityContext.bind(this, response)),
      new StreamFilter(filterLog),
      new StreamBuffer(1000),
      new StreamMap(indexLog),
    )
  }

  protected mapEntityContext<T extends ParsedEntity<unknown>>(
    args: EntityDateRangeResponse<T>,
    entity: T,
  ): ParsedEntityContext<T> {
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
}

export async function ethereumWorkerDomainFactory(
  context: IndexerDomainContext,
  hooks: EthereumIndexerWorkerDomainI,
): Promise<BlockchainIndexerWorkerI<EthereumParsedTransaction>> {
  return new EthereumIndexerWorkerDomain(context, hooks)
}
