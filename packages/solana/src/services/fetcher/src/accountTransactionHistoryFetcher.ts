import { Duration } from 'luxon'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { Utils } from '@aleph-indexer/core'
import {
  BaseFetcherPaginationCursors,
  BaseHistoryFetcher,
  FetcherJobRunnerHandleFetchResult,
  FetcherStateLevelStorage,
} from '@aleph-indexer/framework'
import { SolanaAccountTransactionHistoryStorage } from './dal/accountTransactionHistory.js'
import {
  SolanaAccountTransactionHistoryPaginationCursor,
  SolanaSignature,
} from './types.js'
import {
  SolanaErrorFetching,
  SolanaFetchSignaturesOptions,
  SolanaRPC,
} from '../../../sdk/client.js'

const { JobRunnerReturnCode } = Utils

/**
 * Handles the fetching and processing of signatures on an account.
 */
export class SolanaAccountTransactionHistoryFetcher extends BaseHistoryFetcher<SolanaAccountTransactionHistoryPaginationCursor> {
  protected forwardAutoInterval = true
  protected forwardRatio = 80
  protected forwardRatioThreshold = 100
  protected errorFetching = SolanaErrorFetching.SkipErrors

  /**
   * Initializes the signature fetcher.
   * @param address The account address to fetch related signatures for.
   * @param dal The signature storage.
   * @param solanaRpc The Solana RPC client.
   * @param solanaMainPublicRpc The Solana mainnet public RPC client.
   * @param fetcherStateDAL The fetcher state storage.
   * @param times The number of times to fetch signatures.
   */
  constructor(
    protected address: string,
    protected dal: SolanaAccountTransactionHistoryStorage,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
    protected fetcherStateDAL: FetcherStateLevelStorage<SolanaAccountTransactionHistoryPaginationCursor>,
    protected times = 1,
  ) {
    super(
      {
        id: `solana:account-signature-history:${address}`,
        jobs: {
          forward: {
            times,
            interval: 0,
            intervalInit: 0,
            intervalMax: 1000 * 10,
            handleFetch: (ctx) => this.fetchForward(ctx),
          },
          backward: {
            times,
            interval: 1000 * 10,
            handleFetch: (ctx) => this.fetchBackward(ctx),
          },
        },
      },
      fetcherStateDAL,
    )
  }

  protected async fetchForward({
    firstRun,
    interval,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<
    FetcherJobRunnerHandleFetchResult<SolanaAccountTransactionHistoryPaginationCursor>
  > {
    const { address, errorFetching } = this

    const useHistoricRPC = Boolean(
      this.fetcherState.jobs.forward.useHistoricRPC,
    )
    const rpc = useHistoricRPC ? this.solanaMainPublicRpc : this.solanaRpc

    // @note: not "before" (autodetected by the node (last block height))
    const { signature: until, slot: untilSlot } =
      this.fetcherState.cursors?.forward || {}

    const iterationLimit = !until
      ? 1000
      : firstRun
      ? 1000
      : Number.MAX_SAFE_INTEGER

    const options: SolanaFetchSignaturesOptions = {
      before: undefined,
      address,
      until,
      untilSlot,
      iterationLimit,
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
    FetcherJobRunnerHandleFetchResult<SolanaAccountTransactionHistoryPaginationCursor>
  > {
    const { address, errorFetching } = this

    const useHistoricRPC = Boolean(
      this.fetcherState.jobs.backward.useHistoricRPC,
    )
    const rpc = useHistoricRPC ? this.solanaMainPublicRpc : this.solanaRpc

    // @note: until is autodetected by the node (height 0 / first block)
    const before = this.fetcherState.cursors?.backward?.signature
    const until = undefined
    const iterationLimit = 1000

    const options: SolanaFetchSignaturesOptions = {
      until,
      before,
      address,
      iterationLimit,
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
    lastCursors: BaseFetcherPaginationCursors<SolanaAccountTransactionHistoryPaginationCursor>
  }> {
    const { address } = options

    let error: undefined | Error
    let count = 0
    let lastCursors: BaseFetcherPaginationCursors<SolanaAccountTransactionHistoryPaginationCursor> =
      {}

    console.log(`
      solana transaction | fetchSignatures [${
        goingForward ? 'forward' : 'backward'
      }] { 
        address: ${address}
        useHistoricRPC: ${rpc === this.solanaMainPublicRpc}
      }
    `)

    const runMod =
      this.fetcherState.jobs[goingForward ? 'forward' : 'backward'].numRuns %
      100
    const runOffset = goingForward ? runMod : 99 - runMod

    try {
      const signatures = rpc.fetchTransactionHistory(options)

      for await (const step of signatures) {
        const { chunk } = step

        await this.processSignatures(chunk, goingForward, runOffset, count)

        count += step.count
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
      `solana transaction | fetchForward ratio: {
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
      `solana transaction | [${this.options.id} ${
        goingForward ? '⏩' : '⏪'
      }] signatures received ${signatures.length}`,
      `
        runOffset: ${runOffset}
        sigOffset: ${sigOffset}
      `,
    )

    if (signatures.length === 0) return

    const sigs = signatures.map((signature, index) => {
      const offset = runOffset * 1000000 + (999999 - (index + sigOffset))

      const sig = signature as any
      sig.id = sig.signature

      delete sig.memo
      delete sig.confirmationStatus

      sig.accountSlotIndex = sig.accountSlotIndex || {}
      sig.accountSlotIndex[this.address] = offset

      sig.accounts = Object.keys(sig.accountSlotIndex)

      return sig
    })

    await this.indexSignatures(sigs, goingForward)
  }

  protected async indexSignatures(
    signatures: SolanaSignature[],
    goingForward: boolean,
  ): Promise<void> {
    await this.dal.save(signatures)
  }
}
