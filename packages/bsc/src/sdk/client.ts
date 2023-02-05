import { EthereumClient, EthereumClientOptions } from '@aleph-indexer/ethereum'
import { EthereumAccountTransactionHistoryStorage } from '../services/fetcher/src/transaction/dal/accountTransactionHistory.js'
import { EthereumLogBloomStorage } from '../services/fetcher/src/log/dal/logBloom.js'

export class BscClient extends EthereumClient {
  constructor(
    protected options: EthereumClientOptions,
    protected accountSignatureDAL?: EthereumAccountTransactionHistoryStorage,
    protected logBloomDAL?: EthereumLogBloomStorage,
  ) {
    super(options, accountSignatureDAL, logBloomDAL)
  }
}
