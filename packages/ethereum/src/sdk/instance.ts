import { EthereumClient } from './client.js'
import {
  EthereumAccountTransactionHistoryStorage,
  EthereumLogBloomStorage,
} from './dal.js'

export function createEthereumClient(
  url: string,
  accountSignatureDAL?: EthereumAccountTransactionHistoryStorage,
  logBloomDAL?: EthereumLogBloomStorage,
): EthereumClient {
  return new EthereumClient({ url }, accountSignatureDAL, logBloomDAL)
}
