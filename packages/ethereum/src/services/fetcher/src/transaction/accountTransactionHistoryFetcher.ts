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
import { EthereumClient } from '../../../../sdk/client.js'
import { EthereumAccountTransactionHistoryStorageEntity } from '../../../../types.js'
import { EthereumBlockHistoryFetcher } from '../block/blockHistoryFetcher.js'
import {
  EthereumAccountTransactionHistoryPaginationCursor,
  EthereumFetchSignaturesOptions,
} from '../types.js'

const { JobRunnerReturnCode } = Utils

/**
 * Handles the fetching and processing of signatures on an account.
 */
export class EthereumAccountTransactionHistoryFetcher extends BaseHistoryFetcher<EthereumAccountTransactionHistoryPaginationCursor> {
  protected previousBackwardBlockCursor = Number.MAX_SAFE_INTEGER

  /**
   * Initializes the signature fetcher.
   * @param account The account account to fetch related signatures for.
   * @param ethereumClient The Solana RPC client.
   * @param fetcherStateDAL The fetcher state storage.
   */
  constructor(
    protected account: string,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumAccountTransactionHistoryPaginationCursor>,
    protected ethereumClient: EthereumClient,
    protected blockHistoryFetcher: EthereumBlockHistoryFetcher,
    protected blockchainId: Blockchain = Blockchain.Ethereum,
    protected times = 1,
  ) {
    super(
      {
        id: `${blockchainId}:account-transaction-history:${account}`,
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
    this.previousBackwardBlockCursor = await this.getLastBackwardBlockHeight()
  }

  async getNextRun(fetcherType?: 'forward' | 'backward'): Promise<number> {
    const blockHistoryComplete = await this.blockHistoryFetcher.isComplete(
      'backward',
    )

    // @note: If the block store is not completely synced, ignore backward job and focus on forward job times
    if (!blockHistoryComplete) {
      const newBlocks = await this.areThereNewBlocks()
      if (!newBlocks) return super.getNextRun('forward')
    }

    return super.getNextRun(fetcherType)
  }

  protected async fetchForward(): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumAccountTransactionHistoryPaginationCursor>
  > {
    const { account } = this

    // @note: not "before" (autodetected by the client (last block height))
    const until = this.fetcherState.cursors?.forward?.height
    const iterationLimit = !until ? 1000 : Number.MAX_SAFE_INTEGER

    const options: EthereumFetchSignaturesOptions = {
      before: undefined,
      account,
      until,
      iterationLimit,
    }

    const { lastCursors, error } = await this.fetchTransactionHistory(
      options,
      true,
    )
    return { lastCursors, error }
  }

  protected async fetchBackward({
    interval,
  }: {
    firstRun: boolean
    interval: number
  }): Promise<
    FetcherJobRunnerHandleFetchResult<EthereumAccountTransactionHistoryPaginationCursor>
  > {
    const { account } = this

    // @note: until is autodetected by the client (height 0 / first block)
    let before = this.fetcherState.cursors?.backward?.height

    if (!before) {
      const blockState = await this.blockHistoryFetcher.getState()
      before = blockState.cursors?.forward?.height
    }

    const iterationLimit = 1000

    const options: EthereumFetchSignaturesOptions = {
      until: undefined,
      before,
      account,
      iterationLimit,
    }

    const { lastCursors, error, count } = await this.fetchTransactionHistory(
      options,
      false,
    )

    const newInterval =
      error || count === 0 ? interval + 1000 : JobRunnerReturnCode.Reset

    return { lastCursors, error, newInterval }
  }

  protected async fetchTransactionHistory(
    options: EthereumFetchSignaturesOptions,
    goingForward: boolean,
  ): Promise<{
    error?: Error
    count: number
    lastCursors: BaseFetcherPaginationCursors<EthereumAccountTransactionHistoryPaginationCursor>
  }> {
    const { account } = options

    let error: undefined | Error
    let count = 0
    let lastCursors: BaseFetcherPaginationCursors<EthereumAccountTransactionHistoryPaginationCursor> =
      {}

    console.log(`
      ethereum fetchSignatures [${goingForward ? 'forward' : 'backward'}] { 
        account: ${account}
      }
    `)

    try {
      const signatures = this.ethereumClient.fetchTransactionHistory(options)

      for await (const step of signatures) {
        const { chunk } = step

        await this.indexSignatures(chunk, goingForward)

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
    fetcherState: BaseFetcherState<EthereumAccountTransactionHistoryPaginationCursor>
    jobState: BaseFetcherJobState
    newItems: boolean
    error?: Error
  }): Promise<boolean> {
    const { newItems, error, fetcherState } = ctx
    const fetcherBackward = fetcherState.cursors?.backward?.height
    const isBlockComplete = await this.blockHistoryFetcher.isComplete(
      'backward',
    )

    return (
      isBlockComplete &&
      !newItems &&
      !error &&
      fetcherBackward !== undefined &&
      fetcherBackward <= 0
    )
  }

  protected async indexSignatures(
    signatures: EthereumAccountTransactionHistoryStorageEntity[],
    goingForward: boolean,
  ): Promise<void> {
    // @note: Already indexed on the ethereumClient
    // @note: This is used just to track the sync state of each account independently
    return
  }

  protected async areThereNewBlocks(): Promise<boolean> {
    const lastBackwardBlockCursor = await this.getLastBackwardBlockHeight()

    const nexBlocks = lastBackwardBlockCursor < this.previousBackwardBlockCursor
    this.previousBackwardBlockCursor = lastBackwardBlockCursor

    return nexBlocks
  }

  protected async getLastBackwardBlockHeight(): Promise<number> {
    const blockState = await this.blockHistoryFetcher.getState()
    return blockState?.cursors?.backward?.height || Number.MAX_SAFE_INTEGER
  }
}
