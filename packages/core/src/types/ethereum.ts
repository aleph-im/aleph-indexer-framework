import { BlockTransactionObject, Transaction } from 'web3-eth'
import { RawTransaction } from './common'

export type EthereumBlock = BlockTransactionObject

export type EthereumRawTransaction = RawTransaction & Transaction

export type EthereumSignature = {
  signature: string
  height: number
  timestamp: number
  index: number
  accounts: string[]
}
