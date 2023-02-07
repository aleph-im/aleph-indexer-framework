import {
  Blockchain,
  FetcherMsClient,
  FetcherStateLevelStorage,
  PendingAccountStorage,
} from '@aleph-indexer/framework'
import {
  EthereumAccountLogHistoryStorage,
  EthereumLogHistoryFetcher,
  EthereumRawLogStorage,
} from '@aleph-indexer/ethereum'
import { BscAccountLogHistoryFetcher } from './accountLogHistoryFetcher.js'
import { BscBlockHistoryFetcher } from '../block/blockHistoryFetcher.js'
import { BscClient } from '../../../../sdk/client.js'

export class BscLogHistoryFetcher extends EthereumLogHistoryFetcher {
  constructor(
    protected bscClient: BscClient,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected blockHistoryFetcher: BscBlockHistoryFetcher,
    protected rawLogDAL: EthereumRawLogStorage,
    protected fetcherClient: FetcherMsClient,
    protected accountDAL: PendingAccountStorage,
    protected accountLogHistoryDAL: EthereumAccountLogHistoryStorage,
    protected blockchainId: Blockchain = Blockchain.Bsc,
  ) {
    super(
      bscClient,
      fetcherStateDAL,
      blockHistoryFetcher,
      rawLogDAL,
      fetcherClient,
      accountDAL,
      accountLogHistoryDAL,
      blockchainId,
    )
  }

  protected getAccountFetcher(account: string): BscAccountLogHistoryFetcher {
    return new BscAccountLogHistoryFetcher(
      account,
      this.accountLogHistoryDAL,
      this.rawLogDAL,
      this.fetcherStateDAL,
      this.bscClient,
      this.blockHistoryFetcher,
      this.blockchainId,
    )
  }
}
