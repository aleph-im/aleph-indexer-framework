import {
  Blockchain,
  BlockchainFetcherI,
  FetcherMsClient,
  IndexableEntityType,
  BaseEntityFetcherMain,
} from '@aleph-indexer/framework'
import { EthereumFetcher } from '@aleph-indexer/ethereum'
import { OasysBlockHistoryFetcher } from './src/block/blockHistoryFetcher.js'

export class OasysFetcher
  extends EthereumFetcher
  implements BlockchainFetcherI
{
  constructor(
    protected fetcherClient: FetcherMsClient,
    protected blockHistoryFetcher: OasysBlockHistoryFetcher,
    protected entityFetchers: Partial<
      Record<IndexableEntityType, BaseEntityFetcherMain<any, any, any>>
    >,
    protected blockchainId: Blockchain = Blockchain.Oasys,
  ) {
    super(fetcherClient, blockHistoryFetcher, entityFetchers, blockchainId)
  }
}
