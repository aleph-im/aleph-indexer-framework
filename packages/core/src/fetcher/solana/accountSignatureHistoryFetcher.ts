import { Duration } from 'luxon'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { BaseHistoryFetcher } from '../base/baseFetcher.js'
import {
  BaseFetcherOptions,
  BaseFetcherPaginationCursors,
  FetcherJobRunnerHandleFetchResult,
} from '../base/types.js'
import {
  SolanaSignatureFetcherOptions,
  SolanaAccountSignatureHistoryPaginationCursor,
} from './types.js'
import { FetcherStateLevelStorage } from '../base/dal/fetcherState.js'
import { SolanaFetchSignaturesOptions, SolanaRPC } from '../../rpc/index.js'
import { JobRunnerReturnCode } from '../../utils/index.js'

/**
 * Handles the fetching and processing of signatures on an account.
 */
export class SolanaAccountSignatureHistoryFetcher extends BaseHistoryFetcher<SolanaAccountSignatureHistoryPaginationCursor> {
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
    protected opts: SolanaSignatureFetcherOptions,
    protected fetcherStateDAL: FetcherStateLevelStorage<SolanaAccountSignatureHistoryPaginationCursor>,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
  ) {
    const forward = typeof opts.forward === 'boolean' ? {} : opts.forward
    const backward = typeof opts.backward === 'boolean' ? {} : opts.backward

    const config: BaseFetcherOptions<SolanaAccountSignatureHistoryPaginationCursor> =
      {
        id: `solana:account-signature-history:${opts.address}`,
      }

    if (forward) {
      config.jobs = config.jobs || {}
      config.jobs.forward = {
        ...forward,
        interval: forward.interval || 0,
        intervalMax: forward.intervalMax || 1000 * 10,
        handleFetch: (ctx) => this.fetchForward(ctx),
      }
    }

    if (backward) {
      config.jobs = config.jobs || {}
      config.jobs.backward = {
        ...backward,
        interval: backward.interval || 1000 * 10,
        handleFetch: (ctx) => this.fetchBackward(ctx),
      }
    }

    super(config, fetcherStateDAL)

    if (forward) {
      const { ratio, ratioThreshold, interval } = forward

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
  }): Promise<
    FetcherJobRunnerHandleFetchResult<SolanaAccountSignatureHistoryPaginationCursor>
  > {
    const { address, errorFetching } = this.opts
    const forward =
      typeof this.opts.forward === 'boolean' ? {} : this.opts.forward

    const useHistoricRPC = Boolean(
      this.fetcherState.jobs.forward.useHistoricRPC,
    )
    const rpc = useHistoricRPC ? this.solanaMainPublicRpc : this.solanaRpc

    // @note: not "before" (autodetected by the node (last block height))
    const { signature: until, slot: untilSlot } =
      this.fetcherState.cursors?.forward || {}

    const maxLimit = !until
      ? 1000
      : forward?.iterationFetchLimit ||
        (firstRun ? 1000 : Number.MAX_SAFE_INTEGER)

    const options: SolanaFetchSignaturesOptions = {
      before: undefined,
      address,
      until,
      untilSlot,
      maxLimit,
      errorFetching,
    }

    const { count, lastCursors, error } = await this.fetchSignatures(
      options,
      true,
      rpc,
    )

    const calculateNewIt = this.forwardAutoInterval && (!error || count > 0)

    const newInterval = calculateNewIt
      ? this.calculateNewInterval(count, interval)
      : interval

    return { newInterval, lastCursors, error }
  }

  protected async fetchBackward({
    interval,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<
    FetcherJobRunnerHandleFetchResult<SolanaAccountSignatureHistoryPaginationCursor>
  > {
    const { address, errorFetching } = this.opts
    const backward =
      typeof this.opts.backward === 'boolean' ? {} : this.opts.backward

    const useHistoricRPC = Boolean(
      this.fetcherState.jobs.backward.useHistoricRPC,
    )
    const rpc = useHistoricRPC ? this.solanaMainPublicRpc : this.solanaRpc

    // @note: until is autodetected by the node (height 0 / first block)
    const before = this.fetcherState.cursors?.backward?.signature
    const until = backward?.fetchUntil
    const maxLimit = backward?.iterationFetchLimit || Number.MAX_SAFE_INTEGER

    const options: SolanaFetchSignaturesOptions = {
      until,
      before,
      address,
      maxLimit,
      errorFetching,
    }

    const { lastCursors, error } = await this.fetchSignatures(
      options,
      false,
      rpc,
    )

    // @note: Stop the indexer if there wasn't more items using historic RPC
    const stop = !error && useHistoricRPC && !lastCursors?.backward?.signature
    const newInterval = stop ? JobRunnerReturnCode.Stop : interval

    return { newInterval, lastCursors, error }
  }

  protected async fetchSignatures(
    options: SolanaFetchSignaturesOptions,
    goingForward: boolean,
    rpc = this.solanaRpc,
  ): Promise<{
    error?: Error
    count: number
    lastCursors: BaseFetcherPaginationCursors<SolanaAccountSignatureHistoryPaginationCursor>
  }> {
    const { address } = options

    let error: undefined | Error
    let count = 0
    let lastCursors: BaseFetcherPaginationCursors<SolanaAccountSignatureHistoryPaginationCursor> =
      {}

    console.log(`
      fetchSignatures [${goingForward ? 'forward' : 'backward'}] { 
        address: ${address}
        useHistoricRPC: ${rpc === this.solanaMainPublicRpc}
      }
    `)

    const runMod =
      this.fetcherState.jobs[goingForward ? 'forward' : 'backward'].numRuns %
      100
    const runOffset = goingForward ? runMod : 99 - runMod

    try {
      const signatures = rpc.fetchSignatures(options)

      for await (const step of signatures) {
        const { chunk } = step

        await this.processSignatures(chunk, goingForward, runOffset, count)

        count += chunk.length

        lastCursors = step.cursors
      }
    } catch (e) {
      error = e as Error
    }

    return {
      error,
      count,
      lastCursors,
    }
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
