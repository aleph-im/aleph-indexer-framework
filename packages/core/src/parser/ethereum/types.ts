import { EthereumRawTransaction } from '../../types'
import { ParsedTransactionContextV1 } from '../base'

export type EthereumParsedTransactionV1 = EthereumRawTransaction

export type EthereumParsedTransactionContextV1 =
  ParsedTransactionContextV1<EthereumParsedTransactionV1>
