import { EthereumClient } from './client.js'
import { EthereumAccountTransactionHistoryStorage } from './dal.js'

export function createEthereumClient(
  url: string,
  dbPath: string,
  accountSignatureDAL: EthereumAccountTransactionHistoryStorage,
): EthereumClient {
  return new EthereumClient({ url, dbPath }, accountSignatureDAL)
}
