import { Duration } from 'luxon'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { BaseFetcher } from '../base/baseFetcher.js'
import {
  FetcherJobRunnerHandleFetchResult,
  FetcherJobRunnerUpdateCursorResult,
} from '../base/types.js'
import { SolanaSignatureFetcherOptions, SolanaFetcherCursor } from './types.js'
import { FetcherStateLevelStorage } from '../../storage/fetcherState.js'
import { FetchSignaturesOptions, SolanaRPC } from '../../rpc/index.js'
import { JobRunnerReturnCode } from '../../utils/index.js'

/**
 * Handles the fetching and processing of signatures on an account.
 */
export class SolanaSignatureFetcher extends BaseFetcher<SolanaFetcherCursor> {
  protected forwardAutoInterval = false
  protected forwardRatio = 0
  protected forwardRatioThreshold = 0

  /**
   * Initialize the SignaturesFetcher class.
   * @param opts Fetcher options.
   * @param fetcherStateDAL Fetcher state storage.
   * @param solanaRpc The solana RPC client to use.
   * @param solanaMainPublicRpc The solana mainnet public RPC client to use.
   */
  constructor(
    protected opts: SolanaSignatureFetcherOptions<SolanaFetcherCursor>,
    protected fetcherStateDAL: FetcherStateLevelStorage<SolanaFetcherCursor>,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
  ) {
    super(
      {
        id: `signatures:${opts.address}`,
        forward: opts.forward
          ? {
              ...opts.forward,
              interval: opts.forward.interval || 0,
              handleFetch: (ctx) => this.fetchForward(ctx),
              updateCursor: (ctx) => this.updateCursor(ctx),
            }
          : undefined,
        backward: opts.backward
          ? {
              ...opts.backward,
              handleFetch: (ctx) => this.fetchBackward(ctx),
              updateCursor: (ctx) => this.updateCursor(ctx),
            }
          : undefined,
      },
      fetcherStateDAL,
    )

    if (opts.forward) {
      const { ratio, ratioThreshold, interval } = opts.forward

      if (interval === undefined) {
        this.forwardAutoInterval = true
        this.forwardRatio = ratio || 80
        this.forwardRatioThreshold = ratioThreshold || 100
      }
    }
  }

  protected async fetchForward({
    firstRun,
    interval,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<FetcherJobRunnerHandleFetchResult<SolanaFetcherCursor>> {
    const { address, forward: forwardJobOptions, errorFetching } = this.opts

    const useHistoricRPC = Boolean(this.fetcherState.forward.useHistoricRPC)
    const rpc = useHistoricRPC ? this.solanaMainPublicRpc : this.solanaRpc

    // @note: not "before" (autodetected by the node (last block height))
    const { lastSignature: until, lastSlot: untilSlot } =
      this.fetcherState.cursor || {}

    const maxLimit = !until
      ? 1000
      : forwardJobOptions?.iterationFetchLimit ||
        (firstRun ? 1000 : Number.MAX_SAFE_INTEGER)

    const options: FetchSignaturesOptions = {
      before: undefined,
      address,
      until,
      untilSlot,
      maxLimit,
      errorFetching,
    }

    const { count, lastCursor, error } = await this.fetchSignatures(
      options,
      true,
      rpc,
    )

    const calculateNewIt = this.forwardAutoInterval && (!error || count > 0)

    const newInterval = calculateNewIt
      ? this.calculateNewInterval(count, interval)
      : interval

    return { newInterval, lastCursor, error }
  }

  protected async fetchBackward({
    interval,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<FetcherJobRunnerHandleFetchResult<SolanaFetcherCursor>> {
    const { address, backward: backwardJobOptions, errorFetching } = this.opts

    const useHistoricRPC = Boolean(this.fetcherState.backward.useHistoricRPC)
    const rpc = useHistoricRPC ? this.solanaMainPublicRpc : this.solanaRpc

    // @note: until is autodetected by the node (height 0 / first block)
    const before = this.fetcherState.cursor?.firstSignature
    const until = backwardJobOptions?.fetchUntil

    const maxLimit =
      backwardJobOptions?.iterationFetchLimit || Number.MAX_SAFE_INTEGER

    const options: FetchSignaturesOptions = {
      until,
      before,
      address,
      maxLimit,
      errorFetching,
    }

    const { lastCursor, error } = await this.fetchSignatures(
      options,
      false,
      rpc,
    )

    // @note: Stop the indexer if there wasn't more items using historic RPC
    const stop = !error && useHistoricRPC && !lastCursor?.firstSignature
    const newInterval = stop ? JobRunnerReturnCode.Stop : interval

    return { newInterval, lastCursor, error }
  }

  protected async fetchSignatures(
    options: FetchSignaturesOptions,
    goingForward: boolean,
    rpc = this.solanaRpc,
  ): Promise<{
    error?: Error
    count: number
    lastCursor: SolanaFetcherCursor
  }> {
    const { address } = options

    let error: undefined | Error
    let count = 0
    const lastCursor: SolanaFetcherCursor = {}

    console.log(`
      fetchSignatures [${goingForward ? 'forward' : 'backward'}] { 
        address: ${address}
        useHistoricRPC: ${rpc === this.solanaMainPublicRpc}
      }
    `)

    const runMod =
      this.fetcherState[goingForward ? 'forward' : 'backward'].numRuns % 100
    const runOffset = goingForward ? runMod : 99 - runMod

    try {
      const signatures = rpc.fetchSignatures(options)

      for await (const step of signatures) {
        const { chunk } = step

        await this.processSignatures(chunk, goingForward, runOffset, count)

        count += chunk.length

        lastCursor.firstSignature = step.firstKey?.signature
        lastCursor.firstSlot = step.firstKey?.slot
        lastCursor.firstTimestamp = step.firstKey?.timestamp
        lastCursor.lastSignature = step.lastKey?.signature
        lastCursor.lastSlot = step.lastKey?.slot
        lastCursor.lastTimestamp = step.lastKey?.timestamp
      }
    } catch (e) {
      error = e as Error
    }

    return {
      error,
      count,
      lastCursor,
    }
  }

  protected async updateCursor({
    type,
    prevCursor,
    lastCursor,
  }: {
    type: 'forward' | 'backward'
    prevCursor?: SolanaFetcherCursor
    lastCursor: SolanaFetcherCursor
  }): Promise<FetcherJobRunnerUpdateCursorResult<SolanaFetcherCursor>> {
    let newItems = false
    const newCursor: SolanaFetcherCursor = { ...prevCursor }

    switch (type) {
      case 'backward': {
        if (lastCursor.firstSignature) {
          newCursor.firstSignature = lastCursor.firstSignature
          newCursor.firstSlot = lastCursor.firstSlot
          newCursor.firstTimestamp = lastCursor.firstTimestamp
          newItems = true
        }

        if (!prevCursor?.lastSignature) {
          newCursor.lastSignature = lastCursor.lastSignature
          newCursor.lastSlot = lastCursor.lastSlot
          newCursor.lastTimestamp = lastCursor.lastTimestamp
        }

        break
      }
      case 'forward': {
        if (lastCursor.lastSignature) {
          newCursor.lastSignature = lastCursor.lastSignature
          newCursor.lastSlot = lastCursor.lastSlot
          newCursor.lastTimestamp = lastCursor.lastTimestamp
          newItems = true
        }

        if (!prevCursor?.firstSignature) {
          newCursor.firstSignature = lastCursor.firstSignature
          newCursor.firstSlot = lastCursor.firstSlot
          newCursor.firstTimestamp = lastCursor.firstTimestamp
        }

        break
      }
    }

    return { newCursor, newItems }
  }

  protected calculateNewInterval(count: number, interval: number): number {
    const ratioFactor = count > 0 ? this.forwardRatio / count : 2
    const reset = count > this.forwardRatioThreshold
    const newInterval = Math.max(interval, 1000) * ratioFactor

    const currentDuration = Duration.fromMillis(interval).toISOTime() || '+24h'
    const newDuration = Duration.fromMillis(newInterval).toISOTime() || '+24h'

    console.log(
      `fetchForward ratio: {
        target: ${this.forwardRatio}
        current: ${count}
        factor: ${ratioFactor.toFixed(2)}
        oldInterval: ${currentDuration}
        newInterval: ${newDuration}
        => ${
          reset ? 'reset 🔵' : ratioFactor > 1 ? 'slow down 🔴' : 'speed up 🟢'
        },
      }`,
    )

    if (reset) return JobRunnerReturnCode.Reset
    return newInterval
  }

  protected async processSignatures(
    signatures: ConfirmedSignatureInfo[],
    goingForward: boolean,
    runOffset: number,
    sigOffset: number,
  ): Promise<void> {
    console.log(
      `[${this.options.id} ${goingForward ? '⏩' : '⏪'}] signatures received ${
        signatures.length
      }`,
      `
        runOffset: ${runOffset}
        sigOffset: ${sigOffset}
      `,
    )

    if (signatures.length === 0) return

    const sigs = signatures.map((signature, index) => {
      const offset = runOffset * 1000000 + (999999 - (index + sigOffset))

      const sig = signature as any

      delete sig.memo
      delete sig.confirmationStatus

      sig.accountSlotIndex = sig.accountSlotIndex || {}
      sig.accountSlotIndex[this.opts.address] = offset

      return sig
    })

    await this.opts.indexSignatures(sigs, goingForward)
  }
}
