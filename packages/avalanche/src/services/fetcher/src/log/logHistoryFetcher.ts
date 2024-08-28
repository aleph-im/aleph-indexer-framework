import { AvalancheAccountLogHistoryFetcher } from './accountLogHistoryFetcher.js'
import {
  EthereumAccountLogHistoryFetcherParams,
  EthereumLogHistoryFetcher,
} from '@aleph-indexer/ethereum'

export class AvalancheLogHistoryFetcher extends EthereumLogHistoryFetcher {
  protected getAccountFetcher(
    account: string,
    params: EthereumAccountLogHistoryFetcherParams = {},
  ): AvalancheAccountLogHistoryFetcher {
    return new AvalancheAccountLogHistoryFetcher(
      account,
      params,
      this.blockchainId,
      this.accountLogHistoryDAL,
      this.rawLogDAL,
      this.fetcherStateDAL,
      this.ethereumClient,
      this.blockHistoryFetcher,
    )
  }
}
