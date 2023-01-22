import ethers from 'ethers'
import {
  EthereumRawAccountState,
  EthereumRawTransaction,
  ParsedTransaction,
} from '../../types/index.js'
import { ParsedTransactionContext } from '../base/index.js'

export type EthereumParsedTransaction = EthereumRawTransaction &
  ParsedTransaction<ethers.ethers.utils.TransactionDescription | null>

export type EthereumParsedTransactionContext =
  ParsedTransactionContext<EthereumParsedTransaction>

export type EthereumParsedAccountState = EthereumRawAccountState
