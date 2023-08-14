import { EthereumAbiFactory } from '@aleph-indexer/ethereum'

export class OasysAbiFactory extends EthereumAbiFactory {
  protected getRemoteUrl(address: string): string {
    return `https://scan.oasys.games/api?module=contract&action=getabi&address=${address}`
  }
}
