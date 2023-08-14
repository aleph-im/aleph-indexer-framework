import { FetcherMsI } from './interface.js'
import {
  AddAccountEntityRequestArgs,
  BlockchainFetcherI,
  DelAccountEntityRequestArgs,
  GetAccountEntityStateRequestArgs,
  AccountEntityHistoryState,
  CheckEntityRequestArgs,
  EntityState,
  DelEntityRequestArgs,
  FetcherStateRequestArgs,
  FetcherState,
  FetchAccountEntitiesByDateRequestArgs,
  FetchEntitiesByIdRequestArgs,
} from './src/types.js'
import { FetcherMsClient } from './client.js'
import { InvokeBlockchainMethodRequestArgs } from '../types.js'
import { BlockchainId } from '../../types.js'

/**
 * The main class of the fetcher service.
 */
export class FetcherMsMain implements FetcherMsI {
  protected inited = false

  /**
   * Initialize the fetcher service.
   * @param fetcherClient The fetcher ms client.
   * @param blockchains A dictionary of instances that implements BlockchainFetcherI interface
   */
  constructor(
    protected fetcherClient: FetcherMsClient,
    protected blockchains: Record<BlockchainId, BlockchainFetcherI>,
  ) {}

  /**
   * Initialize the fetcher service.
   * First fetches pending transactions and parses them, then loads existing
   * requests to the service.
   */
  async start(): Promise<void> {
    if (this.inited) return
    this.inited = true

    await Promise.all(
      Object.values(this.blockchains).map((fetcher) => fetcher.start()),
    )
  }

  async stop(): Promise<void> {
    if (!this.inited) return
    this.inited = false

    await Promise.all(
      Object.values(this.blockchains).map((fetcher) => fetcher.stop()),
    )
  }

  getAllFetchers(): string[] {
    return this.fetcherClient.getAllFetchers()
  }

  // Account transaction

  async addAccountEntityFetcher(
    args: AddAccountEntityRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    await fetcher.addAccountEntityFetcher(args)
  }

  async delAccountEntityFetcher(
    args: DelAccountEntityRequestArgs,
  ): Promise<void> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    await fetcher.delAccountEntityFetcher(args)
  }

  async getAccountEntityFetcherState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<AccountEntityHistoryState<unknown> | undefined> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.getAccountEntityFetcherState(args)
  }

  fetchAccountEntitiesByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.fetchAccountEntitiesByDate(args)
  }

  fetchEntitiesById(args: FetchEntitiesByIdRequestArgs): Promise<void> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.fetchEntitiesById(args)
  }

  // Transaction specific methods

  getEntityState(args: CheckEntityRequestArgs): Promise<EntityState[]> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.getEntityState(args)
  }

  delEntityCache(args: DelEntityRequestArgs): Promise<void> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.delEntityCache(args)
  }

  // Extended methods

  async getFetcherState(
    args: FetcherStateRequestArgs,
  ): Promise<FetcherState[]> {
    const { blockchainId } = args

    const blockchains =
      blockchainId && blockchainId.length > 0
        ? blockchainId.map((id) => this.getBlockchainInstance(id))
        : Object.values(this.blockchains)

    return Promise.all(
      blockchains.map((fetcher) => fetcher.getFetcherState(args)),
    )
  }

  async invokeBlockchainMethod<R, A>(
    args: InvokeBlockchainMethodRequestArgs<A>,
  ): Promise<R> {
    const { blockchainId, method, args: params } = args
    const fetcher = this.getBlockchainInstance(blockchainId)

    if (!(method in fetcher)) {
      throw new Error(
        `Method "${method}" not supported in ${blockchainId} blockchain`,
      )
    }

    return (fetcher as any)[method]({ blockchainId, ...params })
  }

  protected getBlockchainInstance(
    blockchainId: BlockchainId,
  ): BlockchainFetcherI {
    const instance = this.blockchains[blockchainId]

    if (!instance) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return instance
  }

  protected getFetcherId(): string {
    return this.fetcherClient.getNodeId()
  }
}
