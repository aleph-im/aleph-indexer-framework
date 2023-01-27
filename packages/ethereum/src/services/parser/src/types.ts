import {
  ParsedTransaction,
  ParsedTransactionContext,
} from '@aleph-indexer/framework'
import ethers from 'ethers'
import {
  EthereumRawAccountState,
  EthereumRawTransaction,
} from '../../../types.js'

export type EthereumParsedTransaction = EthereumRawTransaction &
  ParsedTransaction<ethers.ethers.utils.TransactionDescription | null>

export type EthereumParsedTransactionContext =
  ParsedTransactionContext<EthereumParsedTransaction>

export type EthereumParsedAccountState = EthereumRawAccountState
