import {
  BaseFetcher,
  Blockchain,
  BlockchainFetcherI,
  FetcherMsClient,
  FetcherStateRequestArgs,
  GetAccountEntityStateRequestArgs,
} from '@aleph-indexer/framework'
import { EthereumTransactionHistoryFetcher } from './src/transactionHistoryFetcher.js'
import { EthereumTransactionFetcher } from './src/transactionFetcher.js'
import {
  EthereumAccountTransactionHistoryState,
  EthereumFetcherState,
} from './src/types.js'
import { EthereumStateFetcher } from './src/stateFetcher.js'
import { EthereumBlockHistoryFetcher } from './src/blockHistoryFetcher.js'

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
    args: GetAccountEntityStateRequestArgs,
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
