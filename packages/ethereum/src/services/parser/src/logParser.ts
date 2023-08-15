import { BlockchainId, DefinedParser } from '@aleph-indexer/framework'
import { EthereumClient } from '../../../sdk/client.js'
import { EthereumRawLog } from '../../../types.js'
import { EthereumAbiFactory } from './abiFactory.js'
import { EthereumParsedLog } from './types.js'

export class EthereumLogParser extends DefinedParser<
  EthereumRawLog,
  EthereumParsedLog
> {
  constructor(
    protected blockchainId: BlockchainId,
    protected abiFactory: EthereumAbiFactory,
    protected ethereumClient: EthereumClient,
  ) {
    super()
  }

  async parse(
    rawLog: EthereumRawLog,
  ): Promise<EthereumRawLog | EthereumParsedLog> {
    if (!rawLog.address) return rawLog

    console.log(`${this.blockchainId} rawLog`, JSON.stringify(rawLog, null, 2))

    let abi

    try {
      abi = await this.abiFactory.getAbi(rawLog.address)
    } catch (e: any) {
      // @note: If the contract is not verified on etherscan, return a non parsed event
      // to not block indexers retrying not recoverable errors
      if (e.message !== 'Contract source code not verified') throw e
    }

    const parsedLog = this.ethereumClient.parseLog(rawLog, abi)

    console.log(
      `${this.blockchainId} parsed log => `,
      JSON.stringify(parsedLog, null, 2),
    )
    return parsedLog
  }
}
