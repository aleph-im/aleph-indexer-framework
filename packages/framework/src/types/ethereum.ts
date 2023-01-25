import { BlockTransactionObject, Transaction } from 'web3-eth'
import { RawTransaction } from './common.js'

export type EthereumBlock = BlockTransactionObject

export type EthereumRawTransaction = RawTransaction &
  Transaction & {
    timestamp: number
  }

export type EthereumRawAccountState = {
  account: string
  balance: number
}

export type EthereumSignature = {
  signature: string
  height: number
  timestamp: number
  index: number
  accounts: string[]
}
