import { Utils } from '@aleph-indexer/core'
import {
  BaseFetcherJobState,
  BaseFetcherPaginationCursors,
  BaseFetcherState,
  BaseHistoryFetcher,
  BlockchainId,
  FetcherJobRunnerHandleFetchResult,
  FetcherStateLevelStorage,
} from '@aleph-indexer/framework'
import { EthereumClient } from '../../../../sdk/client.js'
import { EthereumRawLog } from '../../../../types.js'
import { EthereumBlockHistoryFetcher } from '../block/blockHistoryFetcher.js'
import { EthereumAccountLogHistoryStorage } from './dal/accountLogHistory.js'
import { EthereumRawLogStorage } from './dal/rawLog.js'
import {
  EthereumAccountLogHistoryPaginationCursor,
  EthereumFetchLogsOptions,
} from '../types.js'

const { JobRunnerReturnCode } = Utils

/**
 * Handles the fetching and processing of signatures on an account.
 */
export class EthereumAccountLogHistoryFetcher extends BaseHistoryFetcher<EthereumAccountLogHistoryPaginationCursor> {
  protected isContract = false
  protected iterationLimit = 5000
  protected pageLimit = 5000

  /**
   * Initializes the signature fetcher.
   * @param account The account account to fetch related signatures for.
   * @param ethereumClient The Solana RPC client.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected blockchainId: BlockchainId,
    protected account: string,
    protected accountLogHistoryDAL: EthereumAccountLogHistoryStorage,
    protected rawLogDAL: EthereumRawLogStorage,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumAccountLogHistoryPaginationCursor>,
    protected ethereumClient: EthereumClient,
    protected blockHistoryFetcher: EthereumBlockHistoryFetcher,
    protected times = 1,
  ) {
    super(
      {
        id: `${blockchainId}:account-log-history:${account}`,
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

  async getNextRun(fetcherType?: 'forward' | 'backward'): Promise<number> {
    // @note: If the block store is not completely synced, ignore backward job and focus on forward job times
    if (fetcherType === 'backward') {
      const isComplete = await this.blockHistoryFetcher.isComplete('backward')
      if (!isComplete) {
        const continueFetching = await this.continueFetchingBackward()
        if (!continueFetching) return Date.now() + 1000 * 10
      }
    }

    return super.getNextRun(fetcherType)
  }

  protected async fetchForward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumAccountLogHistoryPaginationCursor>
  > {
    const { account, pageLimit } = this

    const forwardCursor = this.fetcherState.cursors?.forward
    const fromBlock = forwardCursor ? forwardCursor.height + 1 : undefined

    const iterationLimit = !fromBlock
      ? this.iterationLimit
      : Number.MAX_SAFE_INTEGER

    const options: EthereumFetchLogsOptions = {
      account,
      fromBlock,
      toBlock: undefined, // last block height
      iterationLimit,
      pageLimit,
      isContractAccount: this.isContract,
    }

    const { lastCursors, error } = await this.fetchLogHistory(options, true)
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
    const { account, pageLimit } = this

    const backwardCursor = this.fetcherState.cursors?.backward
    let toBlock = backwardCursor ? backwardCursor.height - 1 : undefined

    if (toBlock === undefined) {
      const blockState = await this.blockHistoryFetcher.getState()
      toBlock = blockState.cursors?.forward?.height
    }

    if (toBlock === undefined)
      throw new Error(
        `${this.blockchainId} fetchLogHistory needs "toBlock" cursor to be initialized`,
      )

    const iterationLimit = this.iterationLimit

    const options: EthereumFetchLogsOptions = {
      account,
      fromBlock: undefined, // first block height (0)
      toBlock,
      iterationLimit,
      pageLimit,
      isContractAccount: this.isContract,
    }

    const { lastCursors, error, count } = await this.fetchLogHistory(
      options,
      false,
    )

    const newInterval =
      error || count === 0 ? interval + 1000 : JobRunnerReturnCode.Reset

    return { lastCursors, error, newInterval }
  }

  protected async fetchLogHistory(
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
      ${this.blockchainId} fetchLogHistory [${
      goingForward ? 'forward' : 'backward'
    }] { 
        account: ${account}
      }
    `)

    try {
      const items = this.ethereumClient.fetchLogHistory(options)

      for await (const step of items) {
        const { chunk } = step

        await this.indexLogs(chunk, goingForward)

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

  protected async checkCompleteBackward(ctx: {
    fetcherState: BaseFetcherState<EthereumAccountLogHistoryPaginationCursor>
    jobState: BaseFetcherJobState
    newItems: boolean
    error?: Error
  }): Promise<boolean> {
    const { error, fetcherState } = ctx
    const fetcherBackward = fetcherState.cursors?.backward?.height
    const isComplete = await this.blockHistoryFetcher.isComplete('backward')

    return (
      isComplete &&
      !error &&
      fetcherBackward !== undefined &&
      fetcherBackward <= 0
    )
  }

  protected async indexLogs(
    logs: EthereumRawLog[],
    goingForward: boolean,
  ): Promise<void> {
    // @note: If other account also fetchs the same log, accounts property will be merged in the database
    const logsWithAccounts = logs.map((log) => ({
      ...log,
      accounts: [this.account],
    }))

    await Promise.all([
      this.accountLogHistoryDAL.save(logsWithAccounts),
      this.rawLogDAL.save(logs), // @note: This is not necessary (just a  performance hack)
    ])
  }

  protected async continueFetchingBackward(): Promise<boolean> {
    const lastBackwardBlockHeight = await this.getLastBackwardBlockHeight()
    const lastBackwardLogHeight = await this.getLastBackwardLogHeight()
    return lastBackwardBlockHeight < lastBackwardLogHeight
  }

  protected async getLastBackwardBlockHeight(): Promise<number> {
    const blockState = await this.blockHistoryFetcher.getState()
    return blockState?.cursors?.backward?.height || Number.MAX_SAFE_INTEGER
  }

  protected async getLastBackwardLogHeight(): Promise<number> {
    const state = await this.getState()
    return state?.cursors?.backward?.height || Number.MAX_SAFE_INTEGER
  }
}
