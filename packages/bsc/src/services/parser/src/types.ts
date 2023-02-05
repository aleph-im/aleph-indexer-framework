import { ParsedEntity } from '@aleph-indexer/framework'
import ethers from 'ethers'
import {
  EthereumRawAccountState,
  EthereumRawLog,
  EthereumRawTransaction,
} from '../../../types.js'

// -------------------- Transactions
export type EthereumParsedTransaction = EthereumRawTransaction &
  ParsedEntity<ethers.ethers.utils.TransactionDescription | null>

// ---------------------- Logs

export type EthereumParsedLog = EthereumRawLog &
  ParsedEntity<ethers.ethers.utils.LogDescription | null>

// ------------------------ State

export type EthereumParsedAccountState = EthereumRawAccountState
