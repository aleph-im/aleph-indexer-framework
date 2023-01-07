import { Blockchain } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  GetAccountTransactionStateRequestArgs,
} from '../base/types.js'

import { BaseFetcher } from '../base/fetcher.js'
import { EthereumBlockFetcher } from './blockFetcher.js'
import { EthereumTransactionHistoryFetcher } from './transactionHistoryFetcher.js'
import { EthereumTransactionFetcher } from './transactionFetcher.js'
import { EthereumAccountTransactionHistoryState } from './types.js'
import { EthereumAccountStateFetcher } from './accountStateFetcher.js'
import { FetcherMsClient } from '../../client.js'

export class EthereumFetcher extends BaseFetcher implements BlockchainFetcherI {
  constructor(
    protected fetcherClient: FetcherMsClient,
    protected transactionHistoryFetcher: EthereumTransactionHistoryFetcher,
    protected transactionFetcher: EthereumTransactionFetcher,
    protected accountStateFetcher: EthereumAccountStateFetcher,
    protected blockFetcher: EthereumBlockFetcher,
  ) {
    super(
      Blockchain.Ethereum,
      fetcherClient,
      transactionHistoryFetcher,
      transactionFetcher,
      accountStateFetcher,
    )
  }

  async start(): Promise<void> {
    await this.blockFetcher.init()
    this.blockFetcher.run().catch(() => 'ignore')

    await super.start()
  }

  async stop(): Promise<void> {
    await this.blockFetcher.stop()

    await super.stop()
  }

  getAccountTransactionFetcherState(
    args: GetAccountTransactionStateRequestArgs,
  ): Promise<EthereumAccountTransactionHistoryState | undefined> {
    return super.getAccountTransactionFetcherState(args)
  }
}
