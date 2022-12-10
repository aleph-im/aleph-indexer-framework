import {
  EthereumSignatureFetcher as BaseFetcher,
  FetcherStateLevelStorage,
  EthereumSignature,
  EthereumBlockFetcher,
  EthereumClient,
} from '@aleph-indexer/core'
import { EthereumSignatureFetcherState } from './types.js'
import { SignatureStorage } from '../solana/dal/signature.js'

/**
 * Fetches signatures for a given account. Needs to be initialized and started with init() and run() respectively.
 */
export class EthereumSignatureFetcher extends BaseFetcher {
  /**
   * Initializes the signature fetcher.
   * @param account The account account to fetch related signatures for.
   * @param dal The signature storage.
   * @param ethereumClient The Solana RPC client.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected account: string,
    protected dal: SignatureStorage,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected ethereumClient: EthereumClient,
    protected ethereumBlockFetcher: EthereumBlockFetcher,
  ) {
    super(
      {
        account,
        forward: true,
        backward: true,
        indexSignatures: (...args) => this.indexSignatures(...args),
      },
      fetcherStateDAL,
      ethereumClient,
      ethereumBlockFetcher,
    )
  }

  public async getState(): Promise<EthereumSignatureFetcherState> {
    const state: EthereumSignatureFetcherState = {
      fetcher: 'unknown',
      account: this.account,
      completeHistory: this.isComplete('backward'),
    }

    const forward = this.fetcherState.cursors?.forward

    if (forward) {
      state.lastHeight = forward.height
      state.lastTimestamp = forward.timestamp
      state.lastSignature = forward.signature
    }

    const backward = this.fetcherState.cursors?.backward

    if (backward) {
      state.firstHeight = backward.height
      state.firstTimestamp = backward.timestamp
      state.firstSignature = backward.signature
    }

    return state
  }

  protected async indexSignatures(
    signatures: EthereumSignature[],
    goingForward: boolean,
  ): Promise<void> {
    // @note: Already indexed on the ethereumClient
    return
  }
}
