import { ServiceBroker } from 'moleculer'
import { EthereumClient, FetcherStateLevelStorage } from '@aleph-indexer/core'
import { FetcherMsClient } from '../../client.js'
import { BlockchainFetcherI } from '../blockchainFetcher.js'
import { BlockFetcher } from './blockFetcher.js'
import {
  AddAccountFetcherRequestArgs,
  GetAccountFetcherStateRequestArgs,
  SolanaSignatureFetcherState,
  DelAccountFetcherRequestArgs,
} from '../types.js'
import { EthereumBlockStorage } from './dal/block.js'

/**
 * The main class of the fetcher service.
 */
export class EthereumFetcher implements BlockchainFetcherI {
  protected fetcherMsClient: FetcherMsClient
  protected blockFetcher: BlockFetcher

  constructor(
    protected broker: ServiceBroker,
    protected ethereumClient: EthereumClient,
    protected blockDAL: EthereumBlockStorage,
    protected fetcherStateDAL: FetcherStateLevelStorage,
  ) {
    this.fetcherMsClient = new FetcherMsClient(broker)
    this.blockFetcher = new BlockFetcher(
      ethereumClient,
      blockDAL,
      fetcherStateDAL,
    )
  }

  async start(): Promise<void> {
    console.log('---------------------> START')
    await this.blockFetcher.init()
    this.blockFetcher.run().catch(() => 'ignore')
  }

  async stop(): Promise<void> {
    console.log('---------------------> STOP')
    await this.blockFetcher.stop()
  }

  addAccountFetcher(args: AddAccountFetcherRequestArgs): Promise<void> {
    throw new Error('Method not implemented.')
  }

  getAccountFetcherState(
    args: GetAccountFetcherStateRequestArgs,
  ): Promise<SolanaSignatureFetcherState | undefined> {
    throw new Error('Method not implemented.')
  }

  delAccountFetcher(args: DelAccountFetcherRequestArgs): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
