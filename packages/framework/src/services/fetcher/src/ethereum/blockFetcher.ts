import {
  EthereumClient,
  EthereumBlock,
  EthereumBlockHistoryFetcher as BaseFetcher,
  FetcherStateLevelStorage,
  config,
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
    // @todo: Refactor config vars
    if (config.ETHEREUM_INDEX_BLOCKS === 'true') {
      await this.blockDAL.save(blocks)
    }

    await this.ethereumClient.indexBlockSignatures(blocks)
  }
}
