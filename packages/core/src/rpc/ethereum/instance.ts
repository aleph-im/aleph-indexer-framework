import { EthereumClient } from './client.js'

export function createEthereumClient(
  url: string,
  dbPath: string,
): EthereumClient {
  return new EthereumClient({ url, dbPath })
}
