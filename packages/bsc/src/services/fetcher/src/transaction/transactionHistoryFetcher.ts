import {
  Blockchain,
  FetcherMsClient,
  FetcherStateLevelStorage,
  PendingAccountStorage,
} from '@aleph-indexer/framework'
import {
  EthereumAccountTransactionHistoryStorage,
  EthereumTransactionHistoryFetcher,
} from '@aleph-indexer/ethereum'
import { BscAccountTransactionHistoryFetcher } from './accountTransactionHistoryFetcher.js'
import { BscBlockHistoryFetcher } from '../block/blockHistoryFetcher.js'
import { BscClient } from '../../../../sdk/client.js'

export class BscTransactionHistoryFetcher extends EthereumTransactionHistoryFetcher {
  constructor(
    protected bscClient: BscClient,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected blockHistoryFetcher: BscBlockHistoryFetcher,
    protected fetcherClient: FetcherMsClient,
    protected accountDAL: PendingAccountStorage,
    protected accountEntityHistoryDAL: EthereumAccountTransactionHistoryStorage,
    protected blockchainId: Blockchain = Blockchain.Bsc,
  ) {
    super(
      bscClient,
      fetcherStateDAL,
      blockHistoryFetcher,
      fetcherClient,
      accountDAL,
      accountEntityHistoryDAL,
      blockchainId,
    )
  }

  protected getAccountFetcher(
    account: string,
  ): BscAccountTransactionHistoryFetcher {
    return new BscAccountTransactionHistoryFetcher(
      account,
      this.fetcherStateDAL,
      this.bscClient,
      this.blockHistoryFetcher,
      this.blockchainId,
    )
  }
}
