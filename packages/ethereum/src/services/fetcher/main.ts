import {
  BaseFetcher,
  Blockchain,
  BlockchainFetcherI,
  FetcherMsClient,
  IndexableEntityType,
  BaseEntityFetcherMain,
  FetcherStateRequestArgs,
  AddAccountEntityRequestArgs,
  AccountEntityHistoryState,
  CheckEntityRequestArgs,
  DelAccountEntityRequestArgs,
  DelEntityRequestArgs,
  EntityState,
  FetchAccountEntitiesByDateRequestArgs,
  FetchEntitiesByIdRequestArgs,
  GetAccountEntityStateRequestArgs,
} from '@aleph-indexer/framework'
import { EthereumBlockHistoryFetcher } from './src/blockHistoryFetcher.js'
import { EthereumFetcherState } from './src/types.js'

export class EthereumFetcher extends BaseFetcher implements BlockchainFetcherI {
  constructor(
    protected fetcherClient: FetcherMsClient,
    protected blockHistoryFetcher: EthereumBlockHistoryFetcher,
    protected entityFetchers: Partial<
      Record<IndexableEntityType, BaseEntityFetcherMain<any, any, any>>
    >,
  ) {
    super(Blockchain.Ethereum, fetcherClient, entityFetchers)
  }

  async start(): Promise<void> {
    await this.blockHistoryFetcher.init()
    this.blockHistoryFetcher.run().catch(() => 'ignore')
    await super.start()
  }

  async stop(): Promise<void> {
    await this.blockHistoryFetcher.stop()
    await super.stop()
  }

  addAccountEntityFetcher(args: AddAccountEntityRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.addAccountEntityFetcher(args)
  }

  delAccountEntityFetcher(args: DelAccountEntityRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.delAccountEntityFetcher(args)
  }

  getAccountEntityFetcherState(
    args: GetAccountEntityStateRequestArgs,
  ): Promise<AccountEntityHistoryState<any> | undefined> {
    args.account = args.account.toLowerCase()
    return super.getAccountEntityFetcherState(args)
  }

  fetchAccountEntitiesByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    args.account = args.account.toLowerCase()
    return super.fetchAccountEntitiesByDate(args)
  }

  fetchEntitiesById(args: FetchEntitiesByIdRequestArgs): Promise<void> {
    args.ids = args.ids.map((id) => id.toLowerCase())
    return super.fetchEntitiesById(args)
  }

  getEntityState(args: CheckEntityRequestArgs): Promise<EntityState[]> {
    args.ids = args.ids.map((id) => id.toLowerCase())
    return super.getEntityState(args)
  }

  delEntityCache(args: DelEntityRequestArgs): Promise<void> {
    args.ids = args.ids.map((id) => id.toLowerCase())
    return super.delEntityCache(args)
  }

  async getFetcherState(
    args: FetcherStateRequestArgs,
  ): Promise<EthereumFetcherState> {
    const state = await super.getFetcherState(args)

    const blockState = await this.blockHistoryFetcher.getState()

    const firstBlock = blockState.cursors?.backward
    const lastBlock = blockState.cursors?.forward

    // @todo: Improve this
    return state.map((state) => {
      state.data = {
        firstBlock,
        lastBlock,
      }

      return state
    })
  }
}
