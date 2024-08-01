import { EthereumBlockHistoryFetcher } from '@aleph-indexer/ethereum'

export class AvalancheBlockHistoryFetcher extends EthereumBlockHistoryFetcher {
  protected pageLimit = 45
}
