import { ParserContext } from '@aleph-indexer/framework'
import {
  AvalancheParsedLog,
  AvalancheParsedTransaction,
} from '../services/parser/src/types.js'

export type AvalancheTransactionIndexerWorkerDomainI = {
  avalancheTransactionBufferLength?: number // default 1000
  avalancheFilterTransaction(
    context: ParserContext,
    entity: AvalancheParsedTransaction,
  ): Promise<boolean>
  avalancheIndexTransactions(
    context: ParserContext,
    entities: AvalancheParsedTransaction[],
  ): Promise<void>
}

export type AvalancheLogIndexerWorkerDomainI = {
  avalancheLogBufferLength?: number // default 1000
  avalancheFilterLog(context: ParserContext, entity: AvalancheParsedLog): Promise<boolean>
  avalancheIndexLogs(
    context: ParserContext,
    entities: AvalancheParsedLog[],
  ): Promise<void>
}

export type AvalancheIndexerWorkerDomainI = AvalancheTransactionIndexerWorkerDomainI &
  AvalancheLogIndexerWorkerDomainI

export { ethereumWorkerDomainFactory as avalancheWorkerDomainFactory } from '@aleph-indexer/ethereum'
