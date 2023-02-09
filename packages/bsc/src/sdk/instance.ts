import { Blockchain } from '@aleph-indexer/framework'
import {
  EthereumAccountTransactionHistoryStorage,
  EthereumLogBloomStorage,
} from '@aleph-indexer/ethereum'
import { BscClient } from './client.js'

export function createBscClient(
  url: string,
  accountSignatureDAL?: EthereumAccountTransactionHistoryStorage,
  logBloomDAL?: EthereumLogBloomStorage,
  blockchainId?: Blockchain,
): BscClient {
  return new BscClient({ url }, accountSignatureDAL, logBloomDAL, blockchainId)
}
