import { ParserContext } from '@aleph-indexer/framework'
import {
  BscParsedLog,
  BscParsedTransaction,
} from '../services/parser/src/types.js'

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

export { ethereumWorkerDomainFactory as bscWorkerDomainFactory } from '@aleph-indexer/ethereum'
