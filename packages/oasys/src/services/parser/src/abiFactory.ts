import { config } from '@aleph-indexer/core'
import { EthereumAbiFactory } from '@aleph-indexer/ethereum'
import { Blockchain } from '@aleph-indexer/framework'
import { OasysClient } from '../../../sdk/index.js'

export class OasysAbiFactory extends EthereumAbiFactory {
  constructor(
    protected basePath: string,
    protected client: OasysClient,
    protected blockchainId: Blockchain = Blockchain.Oasys,
    protected apiKey = config.OASYS_SCAN_API_KEY,
  ) {
    super(basePath, client, blockchainId, apiKey)
  }

  protected getRemoteUrl(address: string): string {
    return `https://scan.oasys.games/api?module=contract&action=getabi&address=${address}${
      this.apiKey ? `&apikey=${this.apiKey}` : ''
    }`
  }
}
