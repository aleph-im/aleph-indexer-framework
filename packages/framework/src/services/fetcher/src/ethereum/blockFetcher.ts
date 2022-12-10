import {
  EthereumClient,
  EthereumBlock,
  EthereumBlockFetcher as BaseFetcher,
  FetcherStateLevelStorage,
} from '@aleph-indexer/core'
import { EthereumBlockFetcherState } from './types.js'
import { EthereumBlockStorage } from './dal/block.js'

/**
 * Fetches blocks for a given account. Needs to be initialized and started with init() and run() respectively.
 */
export class BlockFetcher extends BaseFetcher {
  /**
   * Initializes the block fetcher.
   * @param ethereumClient The Ethereum RPC client.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected ethereumClient: EthereumClient,
    protected blockDAL: EthereumBlockStorage,
    protected fetcherStateDAL: FetcherStateLevelStorage,
  ) {
    super(
      {
        forward: true,
        backward: true,
        indexBlocks: (...args) => this.indexBlocks(...args),
      },
      fetcherStateDAL,
      ethereumClient,
    )
  }

  // async init() {
  //   console.log('BLOCK FETCHER => ')

  //   // for await (const { value } of await this.blockDAL.getAll()) {
  //   //   console.log('->', !!value, value?.number)
  //   // }

  //   console.log('BLOCK FETCHER END => ')

  //   await super.init()
  // }

  public async getState(): Promise<EthereumBlockFetcherState> {
    const state: EthereumBlockFetcherState = {
      fetcher: 'unknown',
      completeHistory: this.isComplete('backward'),
    }

    const forward = this.fetcherState.cursors?.forward

    if (forward) {
      state.lastHeight = forward.height
      state.lastTimestamp = forward.timestamp
    }

    const backward = this.fetcherState.cursors?.backward

    if (backward) {
      state.firstHeight = backward.height
      state.firstTimestamp = backward.timestamp
    }

    return state
  }

  protected async indexBlocks(
    blocks: EthereumBlock[],
    goingForward: boolean,
  ): Promise<void> {
    await Promise.all([
      this.blockDAL.save(blocks),
      this.ethereumClient.indexBlockSignatures(blocks),
    ])
  }
}
