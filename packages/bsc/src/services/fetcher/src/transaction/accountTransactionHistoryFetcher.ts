import { Blockchain, FetcherStateLevelStorage } from '@aleph-indexer/framework'
import {
  EthereumAccountTransactionHistoryFetcher,
  EthereumAccountTransactionHistoryPaginationCursor,
} from '@aleph-indexer/ethereum'
import { BscClient } from '../../../../sdk/client.js'
import { BscBlockHistoryFetcher } from '../block/blockHistoryFetcher.js'

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
