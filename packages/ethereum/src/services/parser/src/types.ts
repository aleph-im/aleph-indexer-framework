import { ParsedEntity, ParsedEntityContext } from '@aleph-indexer/framework'
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
  ParsedEntityContext<EthereumParsedTransaction>

// ---------------------- Logs

export type EthereumParsedLog = EthereumRawLog &
  ParsedEntity<ethers.ethers.utils.LogDescription | null>

export type EthereumParsedLogContext = ParsedEntityContext<EthereumParsedLog>

// ------------------------ State

export type EthereumParsedAccountState = EthereumRawAccountState
