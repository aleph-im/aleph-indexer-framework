import { BlockTransactionObject, Transaction } from 'web3-eth'
import { Log } from 'web3-core'
import { RawEntity } from '@aleph-indexer/framework'

export type EthereumBlock = BlockTransactionObject

// Transactions

export type EthereumRawTransaction = RawEntity &
  Transaction & {
    signature: string
    timestamp: number
  }

export type EthereumRawAccountState = {
  account: string
  balance: number
}

export type EthereumSignature = {
  id: string
  // @note: Transaction signature (hash)
  signature: string
  // @note: Transaction index in block
  index: number
  // @note: Accounts involved on the tx (from, to)
  accounts: string[]
  // @note: Block info
  height: number
  timestamp: number
}

// Logs

export type EthereumLogBloom = {
  // @note: Relevant info for fast-check if an account is involved on block logs
  logsBloom: string
  // @note: Block info
  height: number
  timestamp: number
}

export type EthereumRawLog = Log & {
  id: string
  // @note: Accounts involved on the log (sha3(address) in topics)
  accounts: string[]
  // @note: Block info
  height: number
  timestamp: number
}
