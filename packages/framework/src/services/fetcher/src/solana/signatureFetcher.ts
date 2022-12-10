import {
  SolanaRPC,
  SolanaSignatureFetcher as BaseFetcher,
  FetcherStateLevelStorage,
  Signature,
} from '@aleph-indexer/core'
import { SignatureDALIndex, SignatureStorage } from './dal/signature.js'
import { SolanaSignatureFetcherState } from '../types.js'

/**
 * Fetches signatures for a given account. Needs to be initialized and started with init() and run() respectively.
 */
export class SignatureFetcher extends BaseFetcher {
  /**
   * Initializes the signature fetcher.
   * @param address The account address to fetch related signatures for.
   * @param dal The signature storage.
   * @param solanaRpc The Solana RPC client.
   * @param solanaMainPublicRpc The Solana mainnet public RPC client.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected address: string,
    protected dal: SignatureStorage,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected times = 1,
  ) {
    super(
      {
        address,
        forward: {
          times,
          iterationFetchLimit: Number.MAX_SAFE_INTEGER,
        },
        backward: {
          times,
          iterationFetchLimit: 1000,
        },
        indexSignatures: (...args) => this.indexSignatures(...args),
      },
      fetcherStateDAL,
      solanaRpc,
      solanaMainPublicRpc,
    )
  }

  async init(): Promise<void> {
    // @todo: configurable by arg scheduled backups
    // await this.dal.backup()
    return super.init()
  }

  async run(): Promise<unknown> {
    const isRestored = await this.dal.restore().catch(() => false)

    // @note: Reset the fetcher state accordingly with the restored signatures
    if (isRestored) {
      const firstItem = await this.dal
        .useIndex(SignatureDALIndex.AccountTimestampIndex)
        .getFirstValueFromTo([this.address], [this.address])

      if (firstItem) {
        this.fetcherState.cursors = this.fetcherState.cursors || {}

        const backwardState = (this.fetcherState.cursors.backward =
          this.fetcherState.cursors.backward || {})

        backwardState.signature = firstItem.signature
        backwardState.slot = firstItem.slot
        backwardState.timestamp = (firstItem.blockTime || 0) * 1000

        this.fetcherState.jobs.backward = {
          ...this.fetcherState.jobs.backward,
          numRuns: firstItem.accountSlotIndex[this.address],
          complete: false,
          useHistoricRPC: false,
        }
      }

      const lastItem = await this.dal
        .useIndex(SignatureDALIndex.AccountTimestampIndex)
        .getLastValueFromTo([this.address], [this.address])

      if (lastItem) {
        this.fetcherState.cursors = this.fetcherState.cursors || {}

        const forwardState = (this.fetcherState.cursors.forward =
          this.fetcherState.cursors.forward || {})

        forwardState.signature = lastItem.signature
        forwardState.slot = lastItem.slot
        forwardState.timestamp = (lastItem.blockTime || 0) * 1000

        this.fetcherState.jobs.forward = {
          ...this.fetcherState.jobs.forward,
          numRuns: lastItem.accountSlotIndex[this.address],
          complete: false,
          useHistoricRPC: false,
        }
      }
    }

    return super.run()
  }

  public async getState(): Promise<SolanaSignatureFetcherState> {
    const state: SolanaSignatureFetcherState = {
      fetcher: 'unknown',
      account: this.address,
      completeHistory: this.isComplete('backward'),
    }

    const forward = this.fetcherState.cursors?.forward

    if (forward) {
      state.lastSlot = forward.slot
      state.lastTimestamp = forward.timestamp
      state.lastSignature = forward.signature
    }

    const backward = this.fetcherState.cursors?.backward

    if (backward) {
      state.firstSlot = backward.slot
      state.firstTimestamp = backward.timestamp
      state.firstSignature = backward.signature
    }

    return state
  }

  protected async indexSignatures(
    signatures: Signature[],
    goingForward: boolean,
  ): Promise<void> {
    await this.dal.save(signatures)
  }
}
