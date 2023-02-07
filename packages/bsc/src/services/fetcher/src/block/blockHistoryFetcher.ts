import { Blockchain, FetcherStateLevelStorage } from '@aleph-indexer/framework'
import {
  EthereumBlockHistoryFetcher,
  EthereumRawBlockStorage,
} from '@aleph-indexer/ethereum'
import { BscClient } from '../../../../sdk/client.js'

export class BscBlockHistoryFetcher extends EthereumBlockHistoryFetcher {
  constructor(
    protected bscClient: BscClient,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected blockDAL?: EthereumRawBlockStorage,
    protected blockchainId: Blockchain = Blockchain.Bsc,
  ) {
    super(bscClient, fetcherStateDAL, blockDAL, blockchainId)
  }
}
