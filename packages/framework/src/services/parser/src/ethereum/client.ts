import {
  EthereumRawAccountState,
  EthereumRawTransaction,
} from '../../../../types/ethereum.js'
import { BaseParserClient } from '../base/client.js'
import {
  EthereumParsedAccountState,
  EthereumParsedTransaction,
} from './types.js'

export default class EthereumParserClient extends BaseParserClient<
  EthereumRawTransaction,
  EthereumParsedTransaction,
  EthereumRawAccountState,
  EthereumParsedAccountState
> {}
