import {
  BaseFetcher,
  Blockchain,
  BlockchainFetcherI,
  FetcherMsClient,
  GetAccountEntityStateRequestArgs,
  IndexableEntityType,
  BaseEntityFetcherMain,
  FetcherStateRequestArgs,
} from '@aleph-indexer/framework'
import { EthereumBlockHistoryFetcher } from './src/blockHistoryFetcher.js'
import {
  EthereumAccountTransactionHistoryState,
  EthereumFetcherState,
} from './src/types.js'

export class EthereumFetcher extends BaseFetcher implements BlockchainFetcherI {
  constructor(
    protected fetcherClient: FetcherMsClient,
    protected blockHistoryFetcher: EthereumBlockHistoryFetcher,
    protected entityFetchers: Partial<
      Record<IndexableEntityType, BaseEntityFetcherMain<any, any, any>>
    >,
  ) {
    super(Blockchain.Ethereum, fetcherClient, entityFetchers)
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

  getAccountEntityFetcherState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<EthereumAccountTransactionHistoryState | undefined> {
    return super.getAccountEntityFetcherState(args)
  }

  async getFetcherState(
    args: FetcherStateRequestArgs,
  ): Promise<EthereumFetcherState> {
    const state = await super.getFetcherState(args)
    const blockState = await this.blockHistoryFetcher.getState()

    const firstBlock = blockState.cursors?.backward
    const lastBlock = blockState.cursors?.forward

    // @todo: Improve this
    return state.map((state) => {
      state.data = {
        firstBlock,
        lastBlock,
      }

      return state
    })
  }
}
