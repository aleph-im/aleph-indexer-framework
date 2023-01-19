import ethers from 'ethers'
import {
  EthereumRawAccountState,
  ParsedTransaction,
} from '../../types/index.js'
import { ParsedTransactionContextV1 } from '../base/index.js'

export type EthereumParsedTransaction =
  ParsedTransaction<ethers.ethers.utils.TransactionDescription>

export type EthereumParsedTransactionContext =
  ParsedTransactionContextV1<EthereumParsedTransaction>

export type EthereumParsedAccountState = EthereumRawAccountState
