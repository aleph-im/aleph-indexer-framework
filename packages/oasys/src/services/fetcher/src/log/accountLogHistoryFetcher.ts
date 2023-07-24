import { Blockchain, FetcherStateLevelStorage } from '@aleph-indexer/framework'
import {
  EthereumBlockHistoryFetcher,
  EthereumAccountLogHistoryFetcher,
  EthereumAccountLogHistoryStorage,
  EthereumRawLogStorage,
  EthereumAccountLogHistoryPaginationCursor,
} from '@aleph-indexer/ethereum'
import { OasysClient } from '../../../../sdk/client.js'

export class OasysAccountLogHistoryFetcher extends EthereumAccountLogHistoryFetcher {
  constructor(
    protected account: string,
    protected accountLogHistoryDAL: EthereumAccountLogHistoryStorage,
    protected rawLogDAL: EthereumRawLogStorage,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumAccountLogHistoryPaginationCursor>,
    protected client: OasysClient,
    protected blockHistoryFetcher: EthereumBlockHistoryFetcher,
    protected blockchainId: Blockchain = Blockchain.Oasys,
    protected times = 1,
  ) {
    super(
      account,
      accountLogHistoryDAL,
      rawLogDAL,
      fetcherStateDAL,
      client,
      blockHistoryFetcher,
      blockchainId,
      times,
    )
  }
}
