import {
  BaseFetcher,
  Blockchain,
  BlockchainFetcherI,
  FetcherMsClient,
  GetAccountTransactionStateRequestArgs,
} from '@aleph-indexer/framework'
import { SolanaTransactionFetcher } from './src/transactionFetcher.js'
import { SolanaTransactionHistoryFetcher } from './src/transactionHistoryFetcher.js'
import {
  FetchAccountTransactionsBySlotRequestArgs,
  SolanaAccountTransactionHistoryState,
} from './src/types.js'
import { SolanaStateFetcher } from './src/stateFetcher.js'

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
