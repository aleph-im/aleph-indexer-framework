import { BlockTransactionObject, Transaction } from 'web3-eth'

export type EthereumBlock = BlockTransactionObject

export type EthereumTransaction = Transaction

export type EthereumSignature = {
  signature: string
  height: number
  timestamp: number
  index: number
  accounts: string[]
}
