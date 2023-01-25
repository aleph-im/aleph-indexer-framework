import { pipeline } from 'stream'
import { promisify } from 'util'
import { Utils } from '@aleph-indexer/core'
import {
  IndexerDomainContext,
  TransactionDateRangeResponse,
} from '../../../../../services/indexer/src/base/types.js'
import {
  EthereumParsedTransaction,
  EthereumParsedTransactionContext,
} from '../../../../../services/parser/src/ethereum/types.js'

const { StreamFilter, StreamMap, StreamBuffer } = Utils

export type EthereumIndexerWorkerDomainI = {
  ethereumFilterTransaction(
    ctx: EthereumParsedTransactionContext,
  ): Promise<boolean>
  ethereumIndexTransaction(
    ctx: EthereumParsedTransactionContext,
  ): Promise<EthereumParsedTransactionContext>
}

export default class EthereumIndexerWorkerDomain {
  constructor(
    protected context: IndexerDomainContext,
    protected hooks: EthereumIndexerWorkerDomainI,
  ) {}

  async onTxDateRange(
    response: TransactionDateRangeResponse<EthereumParsedTransaction>,
  ): Promise<void> {
    const { txs } = response

    const filterTransaction = this.hooks.ethereumFilterTransaction.bind(
      this.hooks,
    )
    const indexTransaction = this.hooks.ethereumIndexTransaction.bind(
      this.hooks,
    )

    return promisify(pipeline)(
      txs as any,
      new StreamMap(this.mapTransactionContext.bind(this, response)),
      new StreamFilter(filterTransaction),
      new StreamBuffer(1000),
      new StreamMap(indexTransaction),
    )
  }

  protected mapTransactionContext(
    args: TransactionDateRangeResponse<EthereumParsedTransaction>,
    tx: EthereumParsedTransaction,
  ): EthereumParsedTransactionContext {
    const { account, startDate, endDate } = args

    return {
      tx,
      parserContext: {
        account,
        startDate,
        endDate,
      },
    }
  }
}
