import { AvalancheAccountLogHistoryFetcher } from './accountLogHistoryFetcher.js'
import { EthereumLogHistoryFetcher } from '@aleph-indexer/ethereum'

export class AvalancheLogHistoryFetcher extends EthereumLogHistoryFetcher {
  protected getAccountFetcher(
    account: string,
  ): AvalancheAccountLogHistoryFetcher {
    return new AvalancheAccountLogHistoryFetcher(
      this.blockchainId,
      account,
      this.accountLogHistoryDAL,
      this.rawLogDAL,
      this.fetcherStateDAL,
      this.ethereumClient,
      this.blockHistoryFetcher,
    )
  }
}
