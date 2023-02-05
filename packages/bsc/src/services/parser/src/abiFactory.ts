import { config } from '@aleph-indexer/core'
import { EthereumAbiFactory } from '@aleph-indexer/ethereum'
import { Blockchain } from '@aleph-indexer/framework'
import { BscClient } from '../../../sdk/index.js'

export class BscAbiFactory extends EthereumAbiFactory {
  constructor(
    protected basePath: string,
    protected bscClient: BscClient,
    protected blockchainId: Blockchain = Blockchain.Bsc,
    protected apiKey = config.BSC_SCAN_API_KEY,
  ) {
    super(basePath, bscClient, blockchainId, apiKey)
  }

  protected getRemoteUrl(address: string): string {
    return `https://api.bscscan.com/api?module=contract&action=getabi&address=${address}${
      this.apiKey ? `&apikey=${this.apiKey}` : ''
    }`
  }
}
