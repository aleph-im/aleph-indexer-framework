import ethers from 'ethers'
import {
  EthereumRawTransaction,
  EthereumParsedTransaction,
} from '@aleph-indexer/core'
import { DefinedParser } from '../base/types.js'
import { Abi, AbiFactory } from './abi/abiFactory.js'

export class EthereumTransactionParser extends DefinedParser<
  EthereumRawTransaction,
  EthereumParsedTransaction
> {
  async parse(
    rawTx: EthereumRawTransaction,
  ): Promise<EthereumRawTransaction | EthereumParsedTransaction> {
    if (!rawTx.to) return rawTx

    const abi: Abi = await AbiFactory.getAbi(rawTx.to)
    const iface = new ethers.utils.Interface(abi as any)

    const parsed = iface.parseTransaction({
      data: rawTx.input,
      value: rawTx.value,
    })

    const parsedTx = { ...rawTx, parsed }

    console.log('ETH parsed => ', parsedTx)
    return parsedTx
  }
}
