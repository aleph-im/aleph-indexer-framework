import {
  EthereumRawTransaction,
  EthereumParsedTransaction,
  EthereumClient,
} from '@aleph-indexer/core'
import { DefinedParser } from '../base/types.js'
import { AbiFactory } from './abiFactory.js'

export class EthereumTransactionParser extends DefinedParser<
  EthereumRawTransaction,
  EthereumParsedTransaction
> {
  constructor(
    protected abiFactory: AbiFactory,
    protected ethereumClient: EthereumClient,
  ) {
    super()
  }

  async parse(
    rawTx: EthereumRawTransaction,
  ): Promise<EthereumRawTransaction | EthereumParsedTransaction> {
    if (!rawTx.to) return rawTx

    console.log('rawTx', JSON.stringify(rawTx, null, 2))

    const abi = await this.abiFactory.getAbi(rawTx.to)
    const parsedTx = this.ethereumClient.parseTransaction(rawTx, abi)

    console.log('ETH parsed => ', JSON.stringify(parsedTx, null, 2))
    return parsedTx
  }
}
