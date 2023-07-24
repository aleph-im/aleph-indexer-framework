import { Blockchain, FetcherStateLevelStorage } from '@aleph-indexer/framework'
import {
  EthereumBlockHistoryFetcher,
  EthereumRawBlockStorage,
  EthereumBlockHistoryFetcherConfig,
} from '@aleph-indexer/ethereum'
import { OasysClient } from '../../../../sdk/client.js'

export class OasysBlockHistoryFetcher extends EthereumBlockHistoryFetcher {
  constructor(
    protected config: EthereumBlockHistoryFetcherConfig,
    protected client: OasysClient,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected blockDAL: EthereumRawBlockStorage,
    protected blockchainId: Blockchain = Blockchain.Oasys,
  ) {
    super(config, client, fetcherStateDAL, blockDAL, blockchainId)
  }
}
