import { EthereumClient } from './client.js'
import { EthereumAccountTransactionHistoryStorage } from './dal.js'

export function createEthereumClient(
  url: string,
  accountSignatureDAL?: EthereumAccountTransactionHistoryStorage,
): EthereumClient {
  return new EthereumClient({ url }, accountSignatureDAL)
}
