import { EthereumAbiFactory } from '@aleph-indexer/ethereum'

export class BscAbiFactory extends EthereumAbiFactory {
  protected getRemoteUrl(address: string): string {
    return `https://api.bscscan.com/api?module=contract&action=getabi&address=${address}${
      this.apiKey ? `&apikey=${this.apiKey}` : ''
    }`
  }
}
