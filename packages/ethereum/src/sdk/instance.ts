import { EthereumAccountTransactionHistoryStorage } from '../services/fetcher/src/transaction/dal/accountTransactionHistory.js'
import { EthereumLogBloomStorage } from '../services/fetcher/src/log/dal/logBloom.js'
import { EthereumClient } from './client.js'

export function createEthereumClient(
  url: string,
  accountSignatureDAL?: EthereumAccountTransactionHistoryStorage,
  logBloomDAL?: EthereumLogBloomStorage,
): EthereumClient {
  return new EthereumClient({ url }, accountSignatureDAL, logBloomDAL)
}
