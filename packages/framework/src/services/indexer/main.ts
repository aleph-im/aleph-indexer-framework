import { Blockchain } from '../../types.js'
import { InvokeBlockchainMethodRequestArgs } from '../types.js'
import { IndexerMsClient } from './client.js'
import { IndexerMsI } from './interface.js'
import { TransactionRequest } from './src/dal/transactionRequest.js'
import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  GetAccountIndexingStateRequestArgs,
  InvokeMethodRequestArgs,
  GetTransactionPendingRequestsRequestArgs,
  BlockchainIndexerI,
} from './src/types.js'

/**
 * Main class of the indexer service. Creates and manages all indexers.
 */
export class IndexerMsMain implements IndexerMsI {
  protected inited = false

  /**
   * @param indexerClient Retrieve contextual information of sibling indexers.
   * @param blockchains A dictionary of instances that implements BlockchainIndexerI interface
   */
  constructor(
    protected indexerClient: IndexerMsClient,
    protected blockchains: Record<Blockchain, BlockchainIndexerI>,
  ) {}

  /**
   * Initialize the indexer service.
   * First fetches pending transactions and parses them, then loads existing
   * requests to the service.
   */
  async start(): Promise<void> {
    if (this.inited) return
    this.inited = true

    await Promise.all(
      Object.values(this.blockchains).map((indexer) => indexer.start()),
    )
  }

  async stop(): Promise<void> {
    if (!this.inited) return
    this.inited = false

    await Promise.all(
      Object.values(this.blockchains).map((indexer) => indexer.stop()),
    )
  }

  getAllIndexers(): string[] {
    return this.indexerClient.getAllIndexers()
  }

  async indexAccount(args: AccountIndexerRequestArgs): Promise<void> {
    const indexer = this.getBlockchainInstance(args.blockchainId)
    await indexer.indexAccount(args)
  }

  async deleteAccount(args: AccountIndexerRequestArgs): Promise<void> {
    const indexer = this.getBlockchainInstance(args.blockchainId)
    await indexer.deleteAccount(args)
  }

  async getAccountState(
    args: GetAccountIndexingStateRequestArgs,
  ): Promise<AccountIndexerState | undefined> {
    const indexer = this.getBlockchainInstance(args.blockchainId)
    return indexer.getAccountState(args)
  }

  async invokeDomainMethod(args: InvokeMethodRequestArgs): Promise<unknown> {
    const indexer = this.getBlockchainInstance(args.blockchainId)
    return indexer.invokeDomainMethod(args)
  }

  // Private API

  async getTransactionRequests(
    args: GetTransactionPendingRequestsRequestArgs,
  ): Promise<TransactionRequest[]> {
    const indexer = this.getBlockchainInstance(args.blockchainId)
    return indexer.getTransactionRequests(args)
  }

  // Extended methods

  async invokeBlockchainMethod<R, A>(
    args: InvokeBlockchainMethodRequestArgs<A>,
  ): Promise<R> {
    const { blockchainId, method, args: params } = args
    const indexer = this.getBlockchainInstance(blockchainId)

    if (!(method in indexer)) {
      throw new Error(
        `Method "${method}" not supported in ${blockchainId} blockchain`,
      )
    }

    return (indexer as any)[method]({ blockchainId, ...params })
  }

  protected getBlockchainInstance(
    blockchainId: Blockchain,
  ): BlockchainIndexerI {
    const instance = this.blockchains[blockchainId]

    if (!instance) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return instance
  }

  protected getIndexerId(): string {
    return this.indexerClient.getNodeId()
  }
}
