import { Blockchain, FetcherStateLevelStorage } from '@aleph-indexer/framework'
import { EthereumAccountTransactionHistoryFetcher } from '@aleph-indexer/ethereum'
import { BscClient } from '../../../../sdk/client.js'
import { BscBlockHistoryFetcher } from '../block/blockHistoryFetcher.js'
import { EthereumAccountTransactionHistoryPaginationCursor } from '../types.js'

export class BscAccountTransactionHistoryFetcher extends EthereumAccountTransactionHistoryFetcher {
  constructor(
    account: string,
    fetcherStateDAL: FetcherStateLevelStorage<EthereumAccountTransactionHistoryPaginationCursor>,
    ethereumClient: BscClient,
    blockHistoryFetcher: BscBlockHistoryFetcher,
    blockchainId: Blockchain = Blockchain.Bsc,
    times?: number,
  ) {
    super(
      account,
      fetcherStateDAL,
      ethereumClient,
      blockHistoryFetcher,
      blockchainId,
      times,
    )
  }
}
