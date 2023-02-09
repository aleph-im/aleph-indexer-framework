import { Blockchain, FetcherStateLevelStorage } from '@aleph-indexer/framework'
import {
  EthereumBlockHistoryFetcher,
  EthereumAccountLogHistoryFetcher,
  EthereumAccountLogHistoryStorage,
  EthereumRawLogStorage,
  EthereumAccountLogHistoryPaginationCursor,
} from '@aleph-indexer/ethereum'
import { BscClient } from '../../../../sdk/client.js'

export class BscAccountLogHistoryFetcher extends EthereumAccountLogHistoryFetcher {
  constructor(
    protected account: string,
    protected accountLogHistoryDAL: EthereumAccountLogHistoryStorage,
    protected rawLogDAL: EthereumRawLogStorage,
    protected fetcherStateDAL: FetcherStateLevelStorage<EthereumAccountLogHistoryPaginationCursor>,
    protected bscClient: BscClient,
    protected blockHistoryFetcher: EthereumBlockHistoryFetcher,
    protected blockchainId: Blockchain = Blockchain.Bsc,
    protected times = 1,
  ) {
    super(
      account,
      accountLogHistoryDAL,
      rawLogDAL,
      fetcherStateDAL,
      bscClient,
      blockHistoryFetcher,
      blockchainId,
      times,
    )
  }
}
