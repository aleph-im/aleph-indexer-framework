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
import { OasysAccountTransactionHistoryFetcher } from './accountTransactionHistoryFetcher.js'
import { OasysBlockHistoryFetcher } from '../block/blockHistoryFetcher.js'
import { OasysClient } from '../../../../sdk/client.js'

export class OasysTransactionHistoryFetcher extends EthereumTransactionHistoryFetcher {
  constructor(
    protected client: OasysClient,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected blockHistoryFetcher: OasysBlockHistoryFetcher,
    protected fetcherClient: FetcherMsClient,
    protected accountDAL: PendingAccountStorage,
    protected accountEntityHistoryDAL: EthereumAccountTransactionHistoryStorage,
    protected blockchainId: Blockchain = Blockchain.Oasys,
  ) {
    super(
      client,
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
  ): OasysAccountTransactionHistoryFetcher {
    return new OasysAccountTransactionHistoryFetcher(
      account,
      this.fetcherStateDAL,
      this.client,
      this.blockHistoryFetcher,
      this.blockchainId,
    )
  }
}
