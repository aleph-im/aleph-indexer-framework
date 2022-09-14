import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { Duration } from 'luxon'
import { FetchSignaturesOptions, SolanaRPC } from '../../solana.js'
import { FetcherStateLevelStorage } from '../../storage/fetcherState.js'
import { JobRunnerReturnCode } from '../../utils/concurrence'
import { Fetcher } from './baseFetcher.js'
import {
  FetcherStateAddressesKeys,
  Signature,
  SignatureFetcherOptions,
} from './types.js'

export abstract class SignatureFetcher extends Fetcher {
  protected forwardAutoInterval = false
  protected forwardRatio = 0
  protected forwardRatioThreshold = 0

  constructor(
    protected opts: SignatureFetcherOptions,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
  ) {
    super(
      {
        id: `signatures:${opts.address}`,
        forwardJobOptions: opts.forwardJobOptions
          ? {
              ...opts.forwardJobOptions,
              interval: opts.forwardJobOptions.interval || 0,
              intervalFn: (ctx) => this.runForward(ctx),
            }
          : undefined,
        backwardJobOptions: opts.backwardJobOptions
          ? {
              ...opts.backwardJobOptions,
              intervalFn: (ctx) => this.runBackward(ctx),
            }
          : undefined,
      },
      fetcherStateDAL,
    )

    if (opts.forwardJobOptions) {
      const { ratio, ratioThreshold, interval } = opts.forwardJobOptions

      if (interval === undefined) {
        this.forwardAutoInterval = true
        this.forwardRatio = ratio || 80
        this.forwardRatioThreshold = ratioThreshold || 100
      }
    }
  }

  protected async runForward({
    firstRun,
    interval,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<{
    error?: Error
    newInterval: number
    lastFetchedKeys: FetcherStateAddressesKeys
  }> {
    const { address, forwardJobOptions, errorFetching } = this.opts

    const usePublicRPC = Boolean(this.fetcherState.forward.usePublicRPC)
    const rpc = usePublicRPC ? this.solanaMainPublicRpc : this.solanaRpc

    // @note: not "before" (autodetected by the node (last block height))
    const { lastSignature: until, lastSlot: untilSlot } =
      this.fetcherState.addresses[address] || {}

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

    const { count, lastFetchedKeys, error } = await this.fetchSignatures(
      options,
      true,
      rpc,
    )

    const calculateNewIt = this.forwardAutoInterval && (!error || count > 0)

    const newInterval = calculateNewIt
      ? this.calculateNewInterval(count, interval)
      : interval

    return { newInterval, lastFetchedKeys, error }
  }

  protected async runBackward({
    interval,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<{
    error?: Error
    newInterval: number
    lastFetchedKeys: FetcherStateAddressesKeys
  }> {
    const { address, backwardJobOptions, errorFetching } = this.opts

    const usePublicRPC = Boolean(this.fetcherState.backward.usePublicRPC)
    const rpc = usePublicRPC ? this.solanaMainPublicRpc : this.solanaRpc

    // @note: until is autodetected by the node (height 0 / first block)
    const before = this.fetcherState.addresses[address]?.firstSignature
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

    const { lastFetchedKeys, error } = await this.fetchSignatures(
      options,
      false,
      rpc,
    )

    // @note: Stop the indexer if there wasnt more items using public RPC
    const stop =
      !error &&
      usePublicRPC &&
      !Object.values(lastFetchedKeys).some(
        ({ firstSignature }) => !!firstSignature,
      )

    const newInterval = stop ? JobRunnerReturnCode.Stop : interval

    return { newInterval, lastFetchedKeys, error }
  }

  protected async fetchSignatures(
    options: FetchSignaturesOptions,
    goingForward: boolean,
    rpc = this.solanaRpc,
  ): Promise<{
    error?: Error
    count: number
    lastFetchedKeys: FetcherStateAddressesKeys
  }> {
    const { address } = options

    let error: undefined | Error
    let count = 0
    const lastFetchedKeys: FetcherStateAddressesKeys = { [address]: {} }
    const state = lastFetchedKeys[address]

    console.log(`
      fetchSignatures [${goingForward ? 'forward' : 'backward'}] { 
        address: ${address}
        usePublicRPC: ${rpc === this.solanaMainPublicRpc}
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

        state.firstSignature = step.firstKey?.signature
        state.firstSlot = step.firstKey?.slot
        state.firstTimestamp = step.firstKey?.timestamp
        state.lastSignature = step.lastKey?.signature
        state.lastSlot = step.lastKey?.slot
        state.lastTimestamp = step.lastKey?.timestamp
      }
    } catch (e) {
      error = e as Error
    }

    return {
      error,
      count,
      lastFetchedKeys,
    }
  }

  protected calculateNewInterval(count: number, interval: number): number {
    const ratioFactor = count > 0 ? this.forwardRatio / count : 2
    const reset = count > this.forwardRatioThreshold
    const newInterval = Math.max(interval, 1000) * ratioFactor

    const currentDuration = Duration.fromMillis(interval).toISOTime() || '+24h'
    const newDuration = Duration.fromMillis(newInterval).toISOTime() || '+24h'

    console.log(
      `runForward ratio: {
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

    await this.indexSignatures(sigs, goingForward)
  }

  protected abstract indexSignatures(
    signatures: Signature[],
    goingForward: boolean,
  ): Promise<void>
}
