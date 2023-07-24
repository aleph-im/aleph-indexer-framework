import { Blockchain } from '@aleph-indexer/framework'
import {
  EthereumAccountTransactionHistoryStorage,
  EthereumLogBloomStorage,
} from '@aleph-indexer/ethereum'
import { OasysClient } from './client.js'

export function createOasysClient(
  url: string,
  accountSignatureDAL?: EthereumAccountTransactionHistoryStorage,
  logBloomDAL?: EthereumLogBloomStorage,
  blockchainId?: Blockchain,
): OasysClient {
  return new OasysClient(
    { url },
    accountSignatureDAL,
    logBloomDAL,
    blockchainId,
  )
}
