import {
  BlockchainFetcherI,
  GetAccountTransactionStateRequestArgs,
} from '../base/types.js'
import { SolanaTransactionFetcher } from './transactionFetcher.js'
import { SolanaTransactionHistoryFetcher } from './transactionHistoryFetcher.js'
import {
  FetchAccountTransactionsBySlotRequestArgs,
  SolanaAccountTransactionHistoryState,
} from './types.js'
import { SolanaStateFetcher } from './stateFetcher.js'
import { BaseFetcher } from '../base/fetcher.js'
import { FetcherMsClient } from '../../client.js'
import { Blockchain } from '../../../../types/common.js'

export class SolanaFetcher extends BaseFetcher implements BlockchainFetcherI {
  constructor(
    protected fetcherClient: FetcherMsClient,
    protected transactionHistoryFetcher: SolanaTransactionHistoryFetcher,
    protected transactionFetcher: SolanaTransactionFetcher,
    protected accountStateFetcher: SolanaStateFetcher,
  ) {
    super(
      Blockchain.Solana,
      fetcherClient,
      transactionHistoryFetcher,
      transactionFetcher,
      accountStateFetcher,
    )
  }

  getAccountTransactionFetcherState(
    args: GetAccountTransactionStateRequestArgs,
  ): Promise<SolanaAccountTransactionHistoryState | undefined> {
    return super.getAccountTransactionFetcherState(args)
  }

  fetchAccountTransactionsBySlot(
    args: FetchAccountTransactionsBySlotRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.transactionHistoryFetcher.fetchAccountTransactionsBySlot(args)
  }
}
