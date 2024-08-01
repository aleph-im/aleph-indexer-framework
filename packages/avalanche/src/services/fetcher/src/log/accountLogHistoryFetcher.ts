import { EthereumAccountLogHistoryFetcher } from '@aleph-indexer/ethereum'

export class AvalancheAccountLogHistoryFetcher extends EthereumAccountLogHistoryFetcher {
  protected pageLimit = 2048
}
