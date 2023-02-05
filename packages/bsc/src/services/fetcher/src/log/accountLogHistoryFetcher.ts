import { Blockchain, FetcherStateLevelStorage } from '@aleph-indexer/framework'
import {
  EthereumBlockHistoryFetcher,
  EthereumAccountLogHistoryFetcher,
} from '@aleph-indexer/ethereum'
import { BscClient } from '../../../../sdk/client.js'
import { EthereumAccountLogHistoryStorage } from './dal/accountLogHistory.js'
import { EthereumRawLogStorage } from './dal/rawLog.js'
import { EthereumAccountLogHistoryPaginationCursor } from '../types.js'

/**
 * Handles the fetching and processing of signatures on an account.
 */
export class BscAccountLogHistoryFetcher extends EthereumAccountLogHistoryFetcher {
  protected isContract = false
  protected iterationLimit = 100
  protected pageLimit = 10

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
