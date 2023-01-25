import {
  BlockchainFetcherI,
  FetcherStateRequestArgs,
  GetAccountTransactionStateRequestArgs,
} from '../base/types.js'

import { BaseFetcher } from '../base/fetcher.js'
import { EthereumTransactionHistoryFetcher } from './transactionHistoryFetcher.js'
import { EthereumTransactionFetcher } from './transactionFetcher.js'
import {
  EthereumAccountTransactionHistoryState,
  EthereumFetcherState,
} from './types.js'
import { EthereumStateFetcher } from './stateFetcher.js'
import { FetcherMsClient } from '../../client.js'
import { Blockchain } from '../../../../types/common.js'
import { EthereumBlockHistoryFetcher } from './blockHistoryFetcher.js'

export class EthereumFetcher extends BaseFetcher implements BlockchainFetcherI {
  constructor(
    protected fetcherClient: FetcherMsClient,
    protected transactionHistoryFetcher: EthereumTransactionHistoryFetcher,
    protected transactionFetcher: EthereumTransactionFetcher,
    protected accountStateFetcher: EthereumStateFetcher,
    protected blockHistoryFetcher: EthereumBlockHistoryFetcher,
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
    await this.blockHistoryFetcher.init()
    this.blockHistoryFetcher.run().catch(() => 'ignore')

    await super.start()
  }

  async stop(): Promise<void> {
    await this.blockHistoryFetcher.stop()

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
    const blockState = await this.blockHistoryFetcher.getState()

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
