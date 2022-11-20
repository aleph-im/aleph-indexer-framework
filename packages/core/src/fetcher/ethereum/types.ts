import { BlockTransactionObject } from 'web3-eth'
import { BaseFetcherJobRunnerOptions } from '../base'

export type EthereumFetcherCursor = {
  firstHeight?: number
  firstTimestamp?: number
  lastHeight?: number
  lastTimestamp?: number
}

export type EthereumBlock = BlockTransactionObject

export type EthereumFetchBlocksOptions = {
  before?: number
  until?: number
  maxLimit?: number
}

export type EthereumFetcherJobRunnerOptions<C> = Omit<
  BaseFetcherJobRunnerOptions<C>,
  'handleFetch' | 'updateCursor'
>

export type EthereumBlockFetcherOptions<C> = {
  forward?: EthereumFetcherJobRunnerOptions<C>
  backward?: EthereumFetcherJobRunnerOptions<C>
  indexBlocks(blocks: EthereumBlock[], goingForward: boolean): Promise<void>
}
