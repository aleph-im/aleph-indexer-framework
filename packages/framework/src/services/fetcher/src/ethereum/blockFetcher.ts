import {
  EthereumClient,
  EthereumBlock,
  EthereumBlockFetcher as BaseFetcher,
  FetcherStateLevelStorage,
} from '@aleph-indexer/core'
import { SignatureStorage } from '../dal/signature.js'
import { BlockFetcherState } from '../types.js'

/**
 * Fetches signatures for a given account. Needs to be initialized and started with init() and run() respectively.
 */
export class BlockFetcher extends BaseFetcher {
  /**
   * Initializes the signature fetcher.
   * @param address The account address to fetch related signatures for.
   * @param dal The signature storage.
   * @param solanaRpc The Solana RPC client.
   * @param solanaMainPublicRpc The Solana mainnet public RPC client.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected dal: SignatureStorage,
    protected ethereumRpc: EthereumClient,
    protected fetcherStateDAL: FetcherStateLevelStorage,
  ) {
    super(
      {
        forward: {
          interval: 1000 * 10,
          intervalMax: 1000 * 10,
        },
        backward: {
          interval: 1000 * 10,
        },
        indexBlocks: (...args) => this.indexBlocks(...args),
      },
      fetcherStateDAL,
      ethereumRpc,
    )
  }

  public async getState(): Promise<BlockFetcherState> {
    const state: BlockFetcherState = {
      fetcher: 'unknown',
      completeHistory: this.isComplete('backward'),
    }

    const addrState = this.fetcherState.cursor || {}

    if (addrState) {
      state.firstHeight = addrState.firstHeight
      state.firstTimestamp = addrState.firstTimestamp

      state.lastHeight = addrState.lastHeight
      state.lastTimestamp = addrState.lastTimestamp
    }

    return state
  }

  protected async indexBlocks(
    blocks: EthereumBlock[],
    goingForward: boolean,
  ): Promise<void> {
    await this.dal.save(blocks)
  }
}
