import { Blockchain, FetcherStateLevelStorage } from '@aleph-indexer/framework'
import {
  EthereumAccountTransactionHistoryFetcher,
  EthereumAccountTransactionHistoryPaginationCursor,
} from '@aleph-indexer/ethereum'
import { OasysClient } from '../../../../sdk/client.js'
import { OasysBlockHistoryFetcher } from '../block/blockHistoryFetcher.js'

export class OasysAccountTransactionHistoryFetcher extends EthereumAccountTransactionHistoryFetcher {
  constructor(
    account: string,
    fetcherStateDAL: FetcherStateLevelStorage<EthereumAccountTransactionHistoryPaginationCursor>,
    ethereumClient: OasysClient,
    blockHistoryFetcher: OasysBlockHistoryFetcher,
    blockchainId: Blockchain = Blockchain.Oasys,
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
