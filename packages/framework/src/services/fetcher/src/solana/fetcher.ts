import { Blockchain } from '@aleph-indexer/core'
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
import { SolanaAccountStateFetcher } from './accountStateFetcher.js'
import { BaseFetcher } from '../base/fetcher.js'
import { FetcherMsClient } from '../../client.js'

export class SolanaFetcher extends BaseFetcher implements BlockchainFetcherI {
  constructor(
    protected fetcherClient: FetcherMsClient,
    protected transactionHistoryFetcher: SolanaTransactionHistoryFetcher,
    protected transactionFetcher: SolanaTransactionFetcher,
    protected accountStateFetcher: SolanaAccountStateFetcher,
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
