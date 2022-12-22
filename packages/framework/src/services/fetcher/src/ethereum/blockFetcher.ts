import {
  EthereumClient,
  EthereumBlock,
  EthereumBlockHistoryFetcher as BaseFetcher,
  FetcherStateLevelStorage,
} from '@aleph-indexer/core'

import { EthereumBlockStorage } from './dal/block.js'

/**
 * Fetches blocks for a given account. Needs to be initialized and started with init() and run() respectively.
 */
export class EthereumBlockFetcher extends BaseFetcher {
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
