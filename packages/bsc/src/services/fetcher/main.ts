import {
  Blockchain,
  BlockchainFetcherI,
  FetcherMsClient,
  IndexableEntityType,
  BaseEntityFetcherMain,
} from '@aleph-indexer/framework'
import { EthereumFetcher } from '@aleph-indexer/ethereum'
import { BscBlockHistoryFetcher } from './src/block/blockHistoryFetcher.js'

export class BscFetcher extends EthereumFetcher implements BlockchainFetcherI {
  constructor(
    protected fetcherClient: FetcherMsClient,
    protected blockHistoryFetcher: BscBlockHistoryFetcher,
    protected entityFetchers: Partial<
      Record<IndexableEntityType, BaseEntityFetcherMain<any, any, any>>
    >,
    protected blockchainId: Blockchain = Blockchain.Bsc,
  ) {
    super(fetcherClient, blockHistoryFetcher, entityFetchers, blockchainId)
  }
}
