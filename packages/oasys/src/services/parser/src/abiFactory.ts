import { EthereumAbiFactory } from '@aleph-indexer/ethereum'
import { Blockchain } from '@aleph-indexer/framework'
import { OasysClient } from '../../../sdk/index.js'

export class OasysAbiFactory extends EthereumAbiFactory {
  constructor(
    protected basePath: string,
    protected client: OasysClient,
    protected blockchainId: Blockchain = Blockchain.Oasys,
  ) {
    super(basePath, client, blockchainId)
  }

  protected getRemoteUrl(address: string): string {
    return `https://scan.oasys.games/api?module=contract&action=getabi&address=${address}`
  }
}
