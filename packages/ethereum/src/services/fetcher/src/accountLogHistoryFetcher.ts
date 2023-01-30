import { Utils } from '@aleph-indexer/core'
import {
  BaseFetcherJobState,
  BaseFetcherPaginationCursors,
  BaseFetcherState,
  BaseHistoryFetcher,
  Blockchain,
  FetcherJobRunnerHandleFetchResult,
  FetcherStateLevelStorage,
} from '@aleph-indexer/framework'
import { EthereumClient } from '../../../sdk/client.js'
import { EthereumRawLog } from '../../../types.js'
import { EthereumBlockHistoryFetcher } from './blockHistoryFetcher.js'
import {
  EthereumAccountLogHistoryPaginationCursor,
  EthereumFetchLogsOptions,
} from './types.js'

const { JobRunnerReturnCode } = Utils

/**
 * Handles the fetching and processing of signatures on an account.
 */
export class EthereumAccountLogHistoryFetcher extends BaseHistoryFetcher<EthereumAccountLogHistoryPaginationCursor> {
  protected isContract = false

  /**
   * Initializes the signature fetcher.
   * @param account The account account to fetch related signatures for.
   * @param ethereumClient The Solana RPC client.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected account: string,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumAccountLogHistoryPaginationCursor>,
    protected ethereumClient: EthereumClient,
    protected blockHistoryFetcher: EthereumBlockHistoryFetcher,
    protected times = 1,
  ) {
    super(
      {
        id: `${Blockchain.Ethereum}:account-log-history:${account}`,
        jobs: {
          forward: {
            times,
            interval: 1000 * 10,
            intervalMax: 1000 * 10,
            handleFetch: () => this.fetchForward(),
            checkComplete: async () => false,
          },
          backward: {
            times,
            interval: 0,
            handleFetch: (...args) => this.fetchBackward(...args),
            checkComplete: (ctx) => this.checkCompleteBackward(ctx),
          },
        },
      },
      fetcherStateDAL,
    )
  }

  async init(): Promise<void> {
    await super.init()
    this.isContract = await this.ethereumClient.isContractAddress(this.account)
  }

  getNextRun(fetcherType?: 'forward' | 'backward'): number {
    // @note: If the block store is not completely synced, ignore backward job and focus on forward job times
    if (!this.blockHistoryFetcher.isComplete('backward')) {
      return super.getNextRun('forward')
    }

    return super.getNextRun(fetcherType)
  }

  protected async fetchForward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumAccountLogHistoryPaginationCursor>
  > {
    const { account } = this

    // @note: not "before" (autodetected by the client (last block height))
    const until = this.fetcherState.cursors?.forward?.height
    const iterationLimit = !until ? 1000 : Number.MAX_SAFE_INTEGER

    const options: EthereumFetchLogsOptions = {
      before: undefined,
      account,
      until,
      iterationLimit,
      isContractAccount: this.isContract,
    }

    const { lastCursors, error } = await this.fetchLogs(options, true)
    return { lastCursors, error }
  }

  protected async fetchBackward({
    interval,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumAccountLogHistoryPaginationCursor>
  > {
    const { account } = this

    // @note: until is autodetected by the client (height 0 / first block)
    let before = this.fetcherState.cursors?.backward?.height

    if (!before) {
      const blockState = await this.blockHistoryFetcher.getState()
      before = blockState.cursors?.forward?.height
    }

    const iterationLimit = 1000

    const options: EthereumFetchLogsOptions = {
      until: undefined,
      before,
      account,
      iterationLimit,
      isContractAccount: this.isContract,
    }

    const { lastCursors, error, count } = await this.fetchLogs(options, false)

    const newInterval =
      error || count === 0 ? interval + 1000 : JobRunnerReturnCode.Reset

    return { lastCursors, error, newInterval }
  }

  protected async fetchLogs(
    options: EthereumFetchLogsOptions,
    goingForward: boolean,
  ): Promise<{
    error?: Error
    count: number
    lastCursors: BaseFetcherPaginationCursors<EthereumAccountLogHistoryPaginationCursor>
  }> {
    const { account } = options

    let error: undefined | Error
    let count = 0
    let lastCursors: BaseFetcherPaginationCursors<EthereumAccountLogHistoryPaginationCursor> =
      {}

    console.log(`
      fetchLogs [${goingForward ? 'forward' : 'backward'}] { 
        account: ${account}
      }
    `)

    try {
      const signatures = this.ethereumClient.fetchLogs(options)

      for await (const step of signatures) {
        const { chunk } = step

        await this.indexLogs(chunk, goingForward)

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

  protected async checkCompleteBackward(ctx: {
    fetcherState: BaseFetcherState<EthereumAccountLogHistoryPaginationCursor>
    jobState: BaseFetcherJobState
    newItems: boolean
    error?: Error
  }): Promise<boolean> {
    const { newItems, error, fetcherState } = ctx
    const isBlockComplete = this.blockHistoryFetcher.isComplete('backward')
    const fetcherBackward = fetcherState.cursors?.backward?.height

    return (
      isBlockComplete &&
      !newItems &&
      !error &&
      fetcherBackward !== undefined &&
      fetcherBackward <= 0
    )
  }

  protected async indexLogs(
    logs: EthereumRawLog[],
    goingForward: boolean,
  ): Promise<void> {
    console.log('🌈🌈🌈', logs.length)

    return
  }
}
