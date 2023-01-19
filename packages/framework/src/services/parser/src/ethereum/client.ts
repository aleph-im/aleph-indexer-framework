import {
  EthereumRawTransaction,
  EthereumParsedTransaction,
  EthereumRawAccountState,
  EthereumParsedAccountState,
} from '@aleph-indexer/core'

import { BaseParserClient } from '../base/client.js'

export default class EthereumParserClient extends BaseParserClient<
  EthereumRawTransaction,
  EthereumParsedTransaction,
  EthereumRawAccountState,
  EthereumParsedAccountState
> {}
