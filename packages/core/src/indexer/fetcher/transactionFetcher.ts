import { Duration } from 'luxon'
import {
  AlephParsedInnerInstruction,
  AlephParsedInstruction,
  AlephParsedTransaction,
} from '../../index.js'
import { FetchDataOptions, SolanaRPC } from '../../solana.js'
import { FetcherStateLevelStorage } from '../../storage/fetcherState.js'
import { JobRunnerReturnCode } from '../../utils/concurrence'
import { Fetcher } from './baseFetcher.js'
import {
  FetcherStateAddressesKeys,
  InstructionContext,
  TransactionFetcherOptions,
} from './types.js'

export abstract class TransactionFetcher extends Fetcher {
  protected forwardAutoInterval = false
  protected forwardRatio = 0
  protected forwardRatioThreshold = 0

  constructor(
    protected opts: TransactionFetcherOptions,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected solanaRpc: SolanaRPC,
    protected solanaMainPublicRpc: SolanaRPC,
  ) {
    super(
      {
        id: opts.id,
        forwardJobOptions: opts.forwardJobOptions
          ? {
              ...opts.forwardJobOptions,
              interval: opts.forwardJobOptions.interval || 0,
              intervalFn: (ctx) => this.runForwardTransactions(ctx),
            }
          : undefined,
        backwardJobOptions: opts.backwardJobOptions
          ? {
              ...opts.backwardJobOptions,
              intervalFn: (ctx) => this.runBackwardTransactions(ctx),
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

  protected async runForwardTransactions({
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
    const usePublicRPC = Boolean(this.fetcherState.forward.usePublicRPC)
    const rpc = usePublicRPC ? this.solanaMainPublicRpc : this.solanaRpc

    // @note: not "before" (autodetected by the node (last block height))
    const options: FetchDataOptions[] = this.opts.fetcherAddresses.map(
      (address) => {
        const { lastSignature: until, lastSlot: untilSlot } =
          this.fetcherState.addresses[address] || {}

        const maxLimit = !until
          ? 1000
          : this.opts.forwardJobOptions?.iterationFetchLimit ||
            (firstRun ? 1000 : Number.MAX_SAFE_INTEGER)

        const opts: FetchDataOptions = {
          before: undefined,
          address,
          until,
          untilSlot,
          maxLimit,
          txCache: this.opts.cacheTransactions,
          errorFetching: this.opts.errorFetching,
        }

        if (usePublicRPC) {
          opts.txsPerRequest = 200
          opts.concurrentTxRequests = 2
        }

        return opts
      },
    )

    const { count, lastFetchedKeys, error } = await this.fetchTransactions(
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

  protected async runBackwardTransactions({
    interval,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<{
    error?: Error
    newInterval: number
    lastFetchedKeys: FetcherStateAddressesKeys
  }> {
    const usePublicRPC = Boolean(this.fetcherState.backward.usePublicRPC)
    const rpc = usePublicRPC ? this.solanaMainPublicRpc : this.solanaRpc

    // @note: until is autodetected by the node (height 0 / first block)
    const options: FetchDataOptions[] = this.opts.fetcherAddresses.map(
      (address, index) => {
        const before = this.fetcherState.addresses[address]?.firstSignature
        const until = this.opts.backwardJobOptions?.fetchUntil?.[index]

        const maxLimit =
          this.opts.backwardJobOptions?.iterationFetchLimit ||
          Number.MAX_SAFE_INTEGER

        const opts: FetchDataOptions = {
          until,
          before,
          address,
          maxLimit,
          txCache: this.opts.cacheTransactions,
          errorFetching: this.opts.errorFetching,
        }

        if (usePublicRPC) {
          opts.txsPerRequest = 200
          opts.concurrentTxRequests = 2
        }

        return opts
      },
    )

    const { lastFetchedKeys, error } = await this.fetchTransactions(
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

  protected async fetchTransactions(
    options: FetchDataOptions[],
    goingForward: boolean,
    rpc = this.solanaRpc,
  ): Promise<{
    error?: Error
    count: number
    lastFetchedKeys: FetcherStateAddressesKeys
  }> {
    let error: undefined | Error
    let count = 0
    const lastFetchedKeys: FetcherStateAddressesKeys = {}

    for (const opts of options) {
      console.log(`
        fetchTransactions [${goingForward ? 'forward' : 'backward'}] { 
          address: ${opts.address}
          usePublicRPC: ${rpc === this.solanaMainPublicRpc}
        }
      `)
    }

    try {
      if (options.length > 1) {
        const txs = rpc.mergeFetchData(options)

        for await (const step of txs) {
          const { chunk } = step

          await this.processTransactions(chunk, goingForward)

          count += chunk.length
          const { firstKeys, lastKeys } = step

          for (const [address, firstKey] of Object.entries(firstKeys)) {
            const state = (lastFetchedKeys[address] =
              lastFetchedKeys[address] || {})

            state.firstSignature = firstKey?.signature
            state.firstSlot = firstKey?.slot
            state.firstTimestamp = firstKey?.timestamp
          }

          for (const [address, lastKey] of Object.entries(lastKeys)) {
            const state = (lastFetchedKeys[address] =
              lastFetchedKeys[address] || {})

            state.lastSignature = lastKey?.signature
            state.lastSlot = lastKey?.slot
            state.lastTimestamp = lastKey?.timestamp
          }
        }
      } else {
        const opt = options[0]
        const txs = rpc.fetchData(opt)

        for await (const step of txs) {
          const { chunk } = step

          await this.processTransactions(chunk, goingForward)

          count += chunk.length

          const state = (lastFetchedKeys[opt.address] =
            lastFetchedKeys[opt.address] || {})

          state.firstSignature = step.firstKey?.signature
          state.firstSlot = step.firstKey?.slot
          state.firstTimestamp = step.firstKey?.timestamp

          state.lastSignature = step.lastKey?.signature
          state.lastSlot = step.lastKey?.slot
          state.lastTimestamp = step.lastKey?.timestamp
        }
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

  protected calculateNewInterval(txCount: number, interval: number): number {
    const ratioFactor = txCount > 0 ? this.forwardRatio / txCount : 2
    const reset = txCount > this.forwardRatioThreshold
    const newInterval = Math.max(interval, 1000) * ratioFactor

    const currentDuration = Duration.fromMillis(interval).toISOTime() || '+24h'
    const newDuration = Duration.fromMillis(newInterval).toISOTime() || '+24h'

    console.log(
      `runForwardTransactions ratio: {
        target: ${this.forwardRatio}
        current: ${txCount}
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

  protected async processTransactions(
    txs: AlephParsedTransaction[],
    goingForward: boolean,
  ): Promise<void> {
    const filteredTxs = await this.filterTransactions(txs, goingForward)

    let filteredIxs: InstructionContext[] = []
    let filteredTxsByIxs: AlephParsedTransaction[] = []
    let totalIxs = 0

    for (const tx of filteredTxs) {
      const instructions = tx.parsed.message.instructions
      const groupIxs = this.groupInstructions(instructions, tx, undefined)
      totalIxs += groupIxs.length

      const filteredTxIxs = await this.filterInstructions(
        groupIxs,
        goingForward,
      )

      if (filteredTxIxs.length > 0) {
        filteredTxsByIxs = filteredTxsByIxs.concat(tx)
      }

      filteredIxs = filteredIxs.concat(filteredTxIxs)
    }

    console.log(
      `[${this.options.id} ${
        goingForward ? '⏩' : '⏪'
      }] transactions filtered/received ${filteredTxsByIxs.length}/${
        txs.length
      }`,
    )

    if (filteredTxsByIxs.length === 0) return

    await this.indexTransactions(filteredTxs, goingForward)

    // @todo: implement it (save tx list + detail)
    // @todo: if detail are stored, improve fetching by doing db lookups before fetching from RPC
    // @todo: fix here too the tx index inside an slot by getting all txs form db merging them with newest with the same slot and re-calculating indexes
    // if (storeTransactions) {
    //   await this.transactionDAL.save(filteredTxs, goingForward)
    // }

    // @todo: configure this behaviour, first storing txs and then processing them in order
    // if (goingForward) txs.reverse()

    // @todo: store txs in a level queue and delegate the procesing/storing to other piece of software

    console.log(
      `[${this.options.id} ${
        goingForward ? '⏩' : '⏪'
      }] instructions filtered/received ${filteredIxs.length}/${totalIxs}`,
    )

    if (this.opts.cacheTransactions) {
      await this.opts.cacheTransactions.save(filteredTxsByIxs)
    }

    await this.indexInstructions(filteredIxs, goingForward)
  }

  protected groupInstructions(
    ixs: (AlephParsedInstruction | AlephParsedInnerInstruction)[],
    parentTx: AlephParsedTransaction,
    parentIx?: AlephParsedInstruction,
    ixsCtx: InstructionContext[] = [],
  ): InstructionContext[] {
    for (const ix of ixs) {
      // @note: index inner ixs before
      if ('innerInstructions' in ix && ix.innerInstructions) {
        this.groupInstructions(ix.innerInstructions, parentTx, ix, ixsCtx)
      }

      ixsCtx.push({ ix, parentTx, parentIx })
    }

    return ixsCtx
  }

  // @note: Filter txs by filtering instructions by default (override if needed)
  protected async filterTransactions(
    txs: AlephParsedTransaction[],
    goingForward: boolean,
  ): Promise<AlephParsedTransaction[]> {
    return txs
  }

  protected abstract filterInstructions(
    ixsContext: InstructionContext[],
    goingForward: boolean,
  ): Promise<InstructionContext[]>

  protected abstract indexInstructions(
    instructions: InstructionContext[],
    goingForward: boolean,
  ): Promise<void>

  protected async indexTransactions(
    txs: AlephParsedTransaction[],
    goingForward: boolean,
  ): Promise<void> {
    return
  }
}
