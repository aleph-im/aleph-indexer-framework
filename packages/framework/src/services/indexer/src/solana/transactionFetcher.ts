import { Blockchain, SolanaParsedTransaction } from '@aleph-indexer/core'
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
import { BaseTransactionFetcher } from '../base/transactionFetcher.js'
import {
  AccountDateRange,
  GetTransactionPendingRequestsRequestArgs,
  SignatureRange,
} from '../base/types.js'

export class SolanaTransactionFetcher extends BaseTransactionFetcher<SolanaParsedTransaction> {
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

  fetchTransactionsBySignature(params: SignatureRange): Promise<number> {
    params.signatures = params.signatures.map((sig) => sig.toLocaleLowerCase())
    return super.fetchTransactionsBySignature(params)
  }

  fetchAccountTransactionsByDate(params: AccountDateRange): Promise<number> {
    params.account = params.account.toLowerCase()
    return super.fetchAccountTransactionsByDate(params)
  }

  getRequests(
    filters?: GetTransactionPendingRequestsRequestArgs,
  ): Promise<TransactionRequest[]> {
    if (filters?.account) {
      filters.account = filters.account.toLowerCase()
    }

    if (filters?.signature) {
      filters.signature = filters.signature.toLowerCase()
    }

    return super.getRequests(filters)
  }

  onTxs(chunk: SolanaParsedTransaction[]): Promise<void> {
    chunk = chunk.map((item) => {
      item.signature = item.signature.toLowerCase()
      return item
    })

    return super.onTxs(chunk)
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
