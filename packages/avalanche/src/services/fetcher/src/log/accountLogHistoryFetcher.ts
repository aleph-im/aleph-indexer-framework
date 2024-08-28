import {
  EthereumAccountLogHistoryFetcher,
  EthereumAccountLogHistoryFetcherParams,
  EthereumAccountLogHistoryPaginationCursor,
  EthereumAccountLogHistoryStorage,
  EthereumBlockHistoryFetcher,
  EthereumClient,
  EthereumRawLogStorage,
} from '@aleph-indexer/ethereum'
import {
  BlockchainId,
  FetcherStateLevelStorage,
} from '@aleph-indexer/framework'

export class AvalancheAccountLogHistoryFetcher extends EthereumAccountLogHistoryFetcher {
  constructor(
    protected account: string,
    protected params: EthereumAccountLogHistoryFetcherParams,
    ...args: [
      BlockchainId,
      EthereumAccountLogHistoryStorage,
      EthereumRawLogStorage,
      FetcherStateLevelStorage<EthereumAccountLogHistoryPaginationCursor>,
      EthereumClient,
      EthereumBlockHistoryFetcher,
    ]
  ) {
    super(account, { pageLimit: 2048, ...params }, ...args)
  }
}
