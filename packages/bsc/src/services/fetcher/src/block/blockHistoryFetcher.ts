import { Blockchain, FetcherStateLevelStorage } from '@aleph-indexer/framework'
import {
  EthereumBlockHistoryFetcher,
  EthereumRawBlockStorage,
  EthereumBlockHistoryFetcherConfig,
} from '@aleph-indexer/ethereum'
import { BscClient } from '../../../../sdk/client.js'

export class BscBlockHistoryFetcher extends EthereumBlockHistoryFetcher {
  constructor(
    protected config: EthereumBlockHistoryFetcherConfig,
    protected bscClient: BscClient,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected blockDAL: EthereumRawBlockStorage,
    protected blockchainId: Blockchain = Blockchain.Bsc,
  ) {
    super(config, bscClient, fetcherStateDAL, blockDAL, blockchainId)
  }
}
