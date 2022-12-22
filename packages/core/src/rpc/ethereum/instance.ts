import { EthereumClient } from './client.js'
import { EthereumAccountSignatureStorage } from './dal.js'

export function createEthereumClient(
  url: string,
  dbPath: string,
  accountSignatureDAL: EthereumAccountSignatureStorage,
): EthereumClient {
  return new EthereumClient({ url, dbPath }, accountSignatureDAL)
}
