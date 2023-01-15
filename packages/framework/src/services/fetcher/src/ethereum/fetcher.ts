import { Blockchain } from '@aleph-indexer/core'
import {
  BlockchainFetcherI,
  FetcherStateRequestArgs,
  GetAccountTransactionStateRequestArgs,
} from '../base/types.js'

import { BaseFetcher } from '../base/fetcher.js'
import { EthereumBlockFetcher } from './blockFetcher.js'
import { EthereumTransactionHistoryFetcher } from './transactionHistoryFetcher.js'
import { EthereumTransactionFetcher } from './transactionFetcher.js'
import {
  EthereumAccountTransactionHistoryState,
  EthereumFetcherState,
} from './types.js'
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

  async getFetcherState(
    args: FetcherStateRequestArgs,
  ): Promise<EthereumFetcherState> {
    const state = await super.getFetcherState(args)
    const blockState = await this.blockFetcher.getState()

    const firstBlock = blockState.cursors?.backward
    const lastBlock = blockState.cursors?.forward

    return {
      ...state,
      data: {
        firstBlock,
        lastBlock,
      },
    }
  }
}
