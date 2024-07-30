import { ParserContext } from '@aleph-indexer/framework'
import {
  BaseParsedLog,
  BaseParsedTransaction,
} from '../services/parser/src/types.js'

export type BaseTransactionIndexerWorkerDomainI = {
  baseTransactionBufferLength?: number // default 1000
  baseFilterTransaction(
    context: ParserContext,
    entity: BaseParsedTransaction,
  ): Promise<boolean>
  baseIndexTransactions(
    context: ParserContext,
    entities: BaseParsedTransaction[],
  ): Promise<void>
}

export type BaseLogIndexerWorkerDomainI = {
  baseLogBufferLength?: number // default 1000
  baseFilterLog(context: ParserContext, entity: BaseParsedLog): Promise<boolean>
  baseIndexLogs(
    context: ParserContext,
    entities: BaseParsedLog[],
  ): Promise<void>
}

export type BaseIndexerWorkerDomainI = BaseTransactionIndexerWorkerDomainI &
  BaseLogIndexerWorkerDomainI

export { ethereumWorkerDomainFactory as baseWorkerDomainFactory } from '@aleph-indexer/ethereum'
