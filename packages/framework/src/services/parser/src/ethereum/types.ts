import ethers from 'ethers'
import { ParsedTransaction } from '../../../../types/common.js'
import {
  EthereumRawAccountState,
  EthereumRawTransaction,
} from '../../../../types/ethereum.js'
import { ParsedTransactionContext } from '../base/types.js'

export type EthereumParsedTransaction = EthereumRawTransaction &
  ParsedTransaction<ethers.ethers.utils.TransactionDescription | null>

export type EthereumParsedTransactionContext =
  ParsedTransactionContext<EthereumParsedTransaction>

export type EthereumParsedAccountState = EthereumRawAccountState
