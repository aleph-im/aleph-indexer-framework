import {
  AccountDateRange,
  BaseIndexerTransactionFetcher,
  Blockchain,
  FetcherMsClient,
  GetTransactionPendingRequestsRequestArgs,
  NonceTimestamp,
  SignatureRange,
  TransactionRequest,
  TransactionRequestIncomingTransactionStorage,
  TransactionRequestPendingSignatureStorage,
  TransactionRequestResponseStorage,
  TransactionRequestStorage,
  TransactionRequestType,
} from '@aleph-indexer/framework'
import { EthereumParsedTransaction } from '../../parser/src/types.js'

export class EthereumIndexerTransactionFetcher extends BaseIndexerTransactionFetcher<EthereumParsedTransaction> {
  constructor(
    protected blockchainId: Blockchain,
    protected fetcherMsClient: FetcherMsClient,
    protected transactionRequestDAL: TransactionRequestStorage,
    protected transactionRequestIncomingTransactionDAL: TransactionRequestIncomingTransactionStorage<EthereumParsedTransaction>,
    protected transactionRequestPendingSignatureDAL: TransactionRequestPendingSignatureStorage,
    protected transactionRequestResponseDAL: TransactionRequestResponseStorage<EthereumParsedTransaction>,
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

  onTxs(chunk: EthereumParsedTransaction[]): Promise<void> {
    chunk = chunk.map((item) => {
      item.signature = item.signature.toLowerCase()
      return item
    })

    return super.onTxs(chunk)
  }

  protected filterIncomingTransactionsByRequest(
    txs: EthereumParsedTransaction[],
    request: TransactionRequest,
  ): {
    filteredTxs: EthereumParsedTransaction[]
    remainingTxs: EthereumParsedTransaction[]
  } {
    const filteredTxs: EthereumParsedTransaction[] = []
    const remainingTxs: EthereumParsedTransaction[] = []

    console.log('FILTERING => ', request)

    switch (request.type) {
      case TransactionRequestType.ByDateRange: {
        const { account, startDate, endDate } = request.params

        for (const tx of txs) {
          if (typeof tx.parsed !== 'object') {
            console.log(
              '👺 error incoming tx without parsed field',
              request.nonce,
              tx,
            )
            continue
          }

          const timestamp = (tx.timestamp || 0) * 1000

          let valid = timestamp >= startDate && timestamp <= endDate

          console.log('FILTERING 222 => ', timestamp, startDate, endDate, valid)

          valid =
            valid &&
            [tx.from, tx.to].some(
              (address) => address?.toLowerCase() === account,
            )

          console.log('FILTERING 333 => ', valid)

          console.log('FILTERING 444 => ', JSON.stringify(tx, null, 2))

          valid ? filteredTxs.push(tx) : remainingTxs.push(tx)
        }

        break
      }
      case TransactionRequestType.BySignatures: {
        const { signatures } = request.params
        const sigSet = new Set(signatures)

        for (const tx of txs) {
          const valid = sigSet.has(tx.signature.toLowerCase())

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
