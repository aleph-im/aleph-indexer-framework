import { FetcherMsClient } from '../../../fetcher/client.js'
import { NonceTimestamp } from '../base/nonce.js'
import {
  TransactionRequest,
  TransactionRequestParams,
  TransactionRequestStorage,
  TransactionRequestType,
} from '../base/dal/transactionRequest.js'
import { TransactionRequestPendingSignatureStorage } from '../base/dal/transactionRequestPendingSignature.js'
import { TransactionRequestResponseStorage } from '../base/dal/transactionRequestResponse.js'
import { TransactionRequestIncomingTransactionStorage } from '../base/dal/transactionRequestIncomingTransaction.js'
import { BaseIndexerTransactionFetcher } from '../base/transactionFetcher.js'
import { Blockchain } from '../../../../types/common.js'
import { SolanaParsedTransaction } from '../../../../types/solana.js'

export class SolanaTransactionFetcher extends BaseIndexerTransactionFetcher<SolanaParsedTransaction> {
  constructor(
    protected blockchainId: Blockchain,
    protected fetcherMsClient: FetcherMsClient,
    protected transactionRequestDAL: TransactionRequestStorage,
    protected transactionRequestIncomingTransactionDAL: TransactionRequestIncomingTransactionStorage<SolanaParsedTransaction>,
    protected transactionRequestPendingSignatureDAL: TransactionRequestPendingSignatureStorage,
    protected transactionRequestResponseDAL: TransactionRequestResponseStorage<SolanaParsedTransaction>,
    protected nonce: NonceTimestamp = new NonceTimestamp(),
  ) {
    super(
      blockchainId,
      fetcherMsClient,
      transactionRequestDAL,
      transactionRequestIncomingTransactionDAL,
      transactionRequestPendingSignatureDAL,
      transactionRequestResponseDAL,
      nonce,
    )
  }

  protected async fetchTransactionSignatures(
    requestParams: TransactionRequestParams,
  ): Promise<void | string[][] | AsyncIterable<string[]>> {
    const { type, params } = requestParams

    switch (type) {
      // @todo: implement it
      case TransactionRequestType.BySlotRange: {
        return []
      }
      default: {
        return super.fetchTransactionSignatures(requestParams)
      }
    }
  }

  protected filterIncomingTransactionsByRequest(
    txs: SolanaParsedTransaction[],
    request: TransactionRequest,
  ): {
    filteredTxs: SolanaParsedTransaction[]
    remainingTxs: SolanaParsedTransaction[]
  } {
    const filteredTxs: SolanaParsedTransaction[] = []
    const remainingTxs: SolanaParsedTransaction[] = []

    switch (request.type) {
      case TransactionRequestType.ByDateRange: {
        const { account, startDate, endDate } = request.params

        for (const tx of txs) {
          if (!tx.parsed) {
            console.log(
              '👺 error incoming tx without parsed field',
              request.nonce,
              tx,
            )
            continue
          }

          const timestamp = (tx.blockTime || 0) * 1000

          let valid = timestamp >= startDate && timestamp <= endDate

          valid =
            valid &&
            tx.parsed.message.accountKeys.some(
              ({ pubkey }) => pubkey === account,
            )

          valid ? filteredTxs.push(tx) : remainingTxs.push(tx)
        }

        break
      }
      case TransactionRequestType.BySignatures: {
        const { signatures } = request.params
        const sigSet = new Set(signatures)

        for (const tx of txs) {
          const valid = sigSet.has(tx.signature)

          valid ? filteredTxs.push(tx) : remainingTxs.push(tx)
        }

        break
      }
      default: {
        return super.filterIncomingTransactionsByRequest(txs, request)
      }
    }

    return { filteredTxs, remainingTxs }
  }
}
