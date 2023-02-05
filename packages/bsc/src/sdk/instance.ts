import { Blockchain } from '@aleph-indexer/framework'
import { EthereumAccountTransactionHistoryStorage } from '../services/fetcher/src/transaction/dal/accountTransactionHistory.js'
import { EthereumLogBloomStorage } from '../services/fetcher/src/log/dal/logBloom.js'
import { BscClient } from './client.js'

export function createBscClient(
  url: string,
  accountSignatureDAL?: EthereumAccountTransactionHistoryStorage,
  logBloomDAL?: EthereumLogBloomStorage,
  blockchainId?: Blockchain,
): BscClient {
  return new BscClient({ url }, accountSignatureDAL, logBloomDAL, blockchainId)
}
