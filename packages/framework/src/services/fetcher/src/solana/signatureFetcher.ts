import {
  SolanaRPC,
  SolanaSignatureFetcher as BaseFetcher,
  FetcherStateLevelStorage,
  Signature,
} from '@aleph-indexer/core'
import { SignatureDALIndex, SignatureStorage } from '../dal/signature.js'
import { SignatureFetcherState } from '../types.js'

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
          intervalMax: 1000 * 10,
          iterationFetchLimit: Number.MAX_SAFE_INTEGER,
        },
        backward: {
          times,
          interval: 1000 * 10,
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
        const state = (this.fetcherState.cursor =
          this.fetcherState.cursor || {})

        state.firstSignature = firstItem.signature
        state.firstSlot = firstItem.slot
        state.firstTimestamp = (firstItem.blockTime || 0) * 1000

        this.fetcherState.backward = {
          ...this.fetcherState.backward,
          numRuns: firstItem.accountSlotIndex[this.address],
          complete: false,
          useHistoricRPC: false,
        }
      }

      const lastItem = await this.dal
        .useIndex(SignatureDALIndex.AccountTimestampIndex)
        .getLastValueFromTo([this.address], [this.address])

      if (lastItem) {
        const state = (this.fetcherState.cursor =
          this.fetcherState.cursor || {})

        state.lastSignature = lastItem.signature
        state.lastSlot = lastItem.slot
        state.lastTimestamp = (lastItem.blockTime || 0) * 1000

        this.fetcherState.forward = {
          ...this.fetcherState.forward,
          numRuns: lastItem.accountSlotIndex[this.address],
          complete: false,
          useHistoricRPC: false,
        }
      }
    }

    return super.run()
  }

  public async getState(): Promise<SignatureFetcherState> {
    const state: SignatureFetcherState = {
      fetcher: 'unknown',
      account: this.address,
      completeHistory: this.isComplete('backward'),
    }

    const addrState = this.fetcherState.cursor || {}

    if (addrState) {
      state.firstSignature = addrState.firstSignature
      state.firstSlot = addrState.firstSlot
      state.firstTimestamp = addrState.firstTimestamp

      state.lastSignature = addrState.lastSignature
      state.lastSlot = addrState.lastSlot
      state.lastTimestamp = addrState.lastTimestamp
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
