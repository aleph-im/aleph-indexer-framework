import { ParserContext } from '@aleph-indexer/framework'
import {
  OasysParsedLog,
  OasysParsedTransaction,
} from '../services/parser/src/types.js'

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

export { ethereumWorkerDomainFactory as oasysWorkerDomainFactory } from '@aleph-indexer/ethereum'
