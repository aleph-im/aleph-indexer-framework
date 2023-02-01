import { BlockTransactionObject, Transaction } from 'web3-eth'
import { Log } from 'web3-core'
import {
  AccountEntityHistoryStorageEntity,
  RawEntity,
} from '@aleph-indexer/framework'

export type EthereumRawBlock = BlockTransactionObject & {
  id: string
  timestamp: number
}

// States

export type EthereumRawAccountState = {
  account: string
  balance: number
}

// Transactions

export type EthereumRawTransaction = RawEntity &
  Transaction & {
    signature: string
    timestamp: number
  }

export type EthereumAccountTransactionHistoryStorageEntity =
  AccountEntityHistoryStorageEntity & {
    // @note: Block info
    height: number
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
  // @note: Log id "height_logIndex"
  id: string
  // @note: Block info
  height: number
  timestamp: number
}

export type EthereumAccountLogHistoryStorageEntity =
  AccountEntityHistoryStorageEntity & {
    // @note: Block info
    height: number
  }
