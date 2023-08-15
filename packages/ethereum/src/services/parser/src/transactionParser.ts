import { BlockchainId, DefinedParser } from '@aleph-indexer/framework'
import { EthereumClient } from '../../../sdk/client.js'
import { EthereumRawTransaction } from '../../../types.js'
import { EthereumAbiFactory } from './abiFactory.js'
import { EthereumParsedTransaction } from './types.js'

export class EthereumTransactionParser extends DefinedParser<
  EthereumRawTransaction,
  EthereumParsedTransaction
> {
  constructor(
    protected blockchainId: BlockchainId,
    protected abiFactory: EthereumAbiFactory,
    protected ethereumClient: EthereumClient,
  ) {
    super()
  }

  async parse(
    rawTx: EthereumRawTransaction,
  ): Promise<EthereumRawTransaction | EthereumParsedTransaction> {
    if (!rawTx.to) return rawTx

    console.log(`${this.blockchainId} rawTx`, JSON.stringify(rawTx, null, 2))

    const abi = await this.abiFactory.getAbi(rawTx.to)
    const parsedTx = this.ethereumClient.parseTransaction(rawTx, abi)

    console.log(
      `${this.blockchainId} parsed tx => `,
      JSON.stringify(parsedTx, null, 2),
    )
    return parsedTx
  }
}
