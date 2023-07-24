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
import { OasysAccountLogHistoryFetcher } from './accountLogHistoryFetcher.js'
import { OasysBlockHistoryFetcher } from '../block/blockHistoryFetcher.js'
import { OasysClient } from '../../../../sdk/client.js'

export class OasysLogHistoryFetcher extends EthereumLogHistoryFetcher {
  constructor(
    protected client: OasysClient,
    protected fetcherStateDAL: FetcherStateLevelStorage,
    protected blockHistoryFetcher: OasysBlockHistoryFetcher,
    protected rawLogDAL: EthereumRawLogStorage,
    protected fetcherClient: FetcherMsClient,
    protected accountDAL: PendingAccountStorage,
    protected accountLogHistoryDAL: EthereumAccountLogHistoryStorage,
    protected blockchainId: Blockchain = Blockchain.Oasys,
  ) {
    super(
      client,
      fetcherStateDAL,
      blockHistoryFetcher,
      rawLogDAL,
      fetcherClient,
      accountDAL,
      accountLogHistoryDAL,
      blockchainId,
    )
  }

  protected getAccountFetcher(account: string): OasysAccountLogHistoryFetcher {
    return new OasysAccountLogHistoryFetcher(
      account,
      this.accountLogHistoryDAL,
      this.rawLogDAL,
      this.fetcherStateDAL,
      this.client,
      this.blockHistoryFetcher,
      this.blockchainId,
    )
  }
}
