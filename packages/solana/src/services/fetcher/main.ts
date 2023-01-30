import {
  BaseFetcher,
  Blockchain,
  BlockchainFetcherI,
  FetcherMsClient,
  IndexableEntityType,
  BaseEntityFetcherMain,
} from '@aleph-indexer/framework'

export class SolanaFetcher extends BaseFetcher implements BlockchainFetcherI {
  constructor(
    fetcherClient: FetcherMsClient,
    entityFetchers: Partial<
      Record<IndexableEntityType, BaseEntityFetcherMain<any, any, any>>
    >,
  ) {
    super(Blockchain.Solana, fetcherClient, entityFetchers)
  }

  // fetchAccountTransactionsBySlot(
  //   args: FetchAccountTransactionsBySlotRequestArgs,
  // ): Promise<void | AsyncIterable<string[]>> {
  //   const entityFetcher = this.getEntityFetcherInstance(
  //     IndexableEntityType.Transaction,
  //   )
  //   return entityFetcher.fetchAccountTransactionsBySlot(args)
  // }
}
