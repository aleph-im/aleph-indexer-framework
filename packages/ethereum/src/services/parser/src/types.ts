import {
  ParsedEntity,
  ParsedTransactionContext,
} from '@aleph-indexer/framework'
import ethers from 'ethers'
import {
  EthereumRawAccountState,
  EthereumRawLog,
  EthereumRawTransaction,
} from '../../../types.js'

// -------------------- Transactions
export type EthereumParsedTransaction = EthereumRawTransaction &
  ParsedEntity<ethers.ethers.utils.TransactionDescription | null>

export type EthereumParsedTransactionContext =
  ParsedTransactionContext<EthereumParsedTransaction>

export type EthereumParsedAccountState = EthereumRawAccountState

// ---------------------- Logs

export type EthereumParsedLog = EthereumRawLog
