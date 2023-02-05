import { Blockchain, FetcherStateLevelStorage } from '@aleph-indexer/framework'
import { EthereumBlockHistoryFetcher } from '@aleph-indexer/ethereum'
import { EthereumRawBlockStorage } from './dal/rawBlock.js'
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
